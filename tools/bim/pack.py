import sys,json,pickle,zlib,struct,collections,math,numpy as np
from cfg import *
SYS=['est','lsa','mur','cub','car','cir','uni','equ','ter','otr']
MG=['con','alb','mad','ace','vid','aca','otr','sin']
def clip_xy(v,f,lo,hi):
    """recorta una malla a un rectángulo en planta (x, y) y devuelve vértices y caras nuevos"""
    out=[]
    for tri in f:
        poly=[v[i] for i in tri]
        for ax,val,keep_ge in ((0,lo[0],True),(0,hi[0],False),(1,lo[1],True),(1,hi[1],False)):
            if not poly: break
            new=[]
            for i in range(len(poly)):
                a=poly[i];b=poly[(i+1)%len(poly)]
                ina=(a[ax]>=val) if keep_ge else (a[ax]<=val)
                inb=(b[ax]>=val) if keep_ge else (b[ax]<=val)
                if ina: new.append(a)
                if ina!=inb:
                    t=(val-a[ax])/(b[ax]-a[ax]);new.append(a+(b-a)*t)
            poly=new
        for k in range(1,len(poly)-1): out.append((poly[0],poly[k],poly[k+1]))
    if not out: return np.zeros((0,3),np.float32),np.zeros((0,3),np.int32)
    vv=np.array([p for t in out for p in t],dtype=np.float32);ff=np.arange(len(vv),dtype=np.int32).reshape(-1,3)
    return weld(vv,ff)
def weld(v,f,q=1e-4):
    """une vértices repetidos (mallas en sopa de triángulos) y quita triángulos degenerados"""
    k=np.round(v.astype(np.float64)/q).astype(np.int64)
    _,idx,inv=np.unique(k,axis=0,return_index=True,return_inverse=True)
    inv=inv.reshape(-1);f2=inv[f];ok=(f2[:,0]!=f2[:,1])&(f2[:,1]!=f2[:,2])&(f2[:,0]!=f2[:,2])
    return v[idx].astype(np.float32),f2[ok].astype(np.int32)

import fast_simplification as FS
BASE_CAP={'mur':1500,'lsa':1500,'cub':1500,'ter':1500}
def target(n,sysid,k):
    cap=BASE_CAP.get(sysid,250)*k; keep=(0.3 if sysid in BASE_CAP else 0.10)*k
    if n<=cap: return n
    return max(48,int(cap+keep*(n-cap)))
def simp(v,f,t):
    if t>=len(f): return v,f
    vv,ff=FS.simplify(v.astype(np.float64),f.astype(np.int64),target_reduction=1-t/len(f))
    if len(ff)==0: return v,f
    return vv.astype(np.float32),ff.astype(np.int32)

HF={'hotel-tucan','pumarrinri-mod3a'}   # terreno reconstruido como superficie continua (sólidos topográficos con triangulación dañada)
def yaw_of(P):
    """ángulo (grados, en [-45,45]) que alinea la planta con los ejes; 0 si ya está alineada"""
    best=None
    for a in np.arange(-45,45.01,0.25):
        t=math.radians(a);R=np.array([[math.cos(t),-math.sin(t)],[math.sin(t),math.cos(t)]]);w=np.ptp(P@R,0);ar=w[0]*w[1]
        if best is None or ar<best[0]: best=(ar,a)
    return best[1] if best[0]<0.9*np.ptp(P,0).prod() else 0.0
def rot_xy(v,a,c):
    t=math.radians(a);R=np.array([[math.cos(t),-math.sin(t)],[math.sin(t),math.cos(t)]])
    w=v.copy();w[:,:2]=(v[:,:2]-c)@R+c;return w
def terrain_block(tr,wlo,whi,zfloor):
    """Superficie continua del terreno: cota más alta de todo el terreno bajo cada nodo de una malla regular,
    huecos completados con la cota vecina más cercana y suavizada, más zócalo lateral y base plana."""
    from scipy import ndimage
    W=whi[0]-wlo[0];H=whi[1]-wlo[1]
    h=max(0.5,math.sqrt(W*H/5000.0));nx=int(math.ceil(W/h));ny=int(math.ceil(H/h))
    xs=wlo[0]+(whi[0]-wlo[0])*np.arange(nx+1)/nx;ys=wlo[1]+(whi[1]-wlo[1])*np.arange(ny+1)/ny
    Z=np.full((ny+1,nx+1),-np.inf)
    for v,f in tr:
        p=v[f].astype(np.float64);n=np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]);ln=np.linalg.norm(n,axis=1)
        keep=(ln>1e-9)&(n[:,2]/np.maximum(ln,1e-12)>0.05)
        for t in p[keep]:
            i0=max(0,int(np.searchsorted(xs,t[:,0].min()-1e-9)));i1=min(nx,int(np.searchsorted(xs,t[:,0].max()+1e-9,side='right'))-1)
            j0=max(0,int(np.searchsorted(ys,t[:,1].min()-1e-9)));j1=min(ny,int(np.searchsorted(ys,t[:,1].max()+1e-9,side='right'))-1)
            if i1<i0 or j1<j0: continue
            X,Y=np.meshgrid(xs[i0:i1+1],ys[j0:j1+1])
            d=(t[1,1]-t[2,1])*(t[0,0]-t[2,0])+(t[2,0]-t[1,0])*(t[0,1]-t[2,1])
            if abs(d)<1e-12: continue
            l1=((t[1,1]-t[2,1])*(X-t[2,0])+(t[2,0]-t[1,0])*(Y-t[2,1]))/d
            l2=((t[2,1]-t[0,1])*(X-t[2,0])+(t[0,0]-t[2,0])*(Y-t[2,1]))/d
            l3=1-l1-l2;e=-1e-9
            ins=(l1>=e)&(l2>=e)&(l3>=e)
            if not ins.any(): continue
            z=l1*t[0,2]+l2*t[1,2]+l3*t[2,2]
            sub=Z[j0:j1+1,i0:i1+1];Z[j0:j1+1,i0:i1+1]=np.where(ins,np.maximum(sub,z),sub)
    miss=~np.isfinite(Z);cov=1-miss.mean()
    if miss.all(): return None,None,cov
    if miss.any():
        _,(ii,jj)=ndimage.distance_transform_edt(miss,return_indices=True)
        Z2=Z[ii,jj].copy()
        for _ in range(40):
            A=np.pad(Z2,1,mode='edge');avg=(A[:-2,1:-1]+A[2:,1:-1]+A[1:-1,:-2]+A[1:-1,2:])/4
            Z2=np.where(miss,avg,Z2)
        Z=Z2
    zb=min(float(Z.min()),zfloor)-1.0
    X,Y=np.meshgrid(xs,ys);top=np.stack([X.ravel(),Y.ravel(),Z.ravel()],1)
    idx=np.arange((ny+1)*(nx+1)).reshape(ny+1,nx+1)
    a=idx[:-1,:-1];b=idx[:-1,1:];c=idx[1:,1:];d=idx[1:,:-1]
    flip=np.abs(Z[:-1,:-1]-Z[1:,1:])>np.abs(Z[:-1,1:]-Z[1:,:-1])
    t1=np.where(flip[...,None],np.stack([a,b,d],-1),np.stack([a,b,c],-1)).reshape(-1,3)
    t2=np.where(flip[...,None],np.stack([b,c,d],-1),np.stack([a,c,d],-1)).reshape(-1,3)
    V=[top];F=[np.concatenate([t1,t2])];off=len(top)
    def wall(pa,pb_,out):
        nonlocal off
        A=np.array(pa);B=np.array(pb_);A0=A.copy();A0[2]=zb;B0=B.copy();B0[2]=zb
        vv=np.array([A,B,B0,A0]);tri=np.array([[0,1,2],[0,2,3]])
        n=np.cross(vv[tri[0,1]]-vv[tri[0,0]],vv[tri[0,2]]-vv[tri[0,0]])
        if np.dot(n,out)<0: tri=tri[:,::-1]
        V.append(vv);F.append(tri+off);off+=4
    for i in range(nx): wall(top[idx[0,i]],top[idx[0,i+1]],(0,-1,0));wall(top[idx[ny,i]],top[idx[ny,i+1]],(0,1,0))
    for j in range(ny): wall(top[idx[j,0]],top[idx[j+1,0]],(-1,0,0));wall(top[idx[j,nx]],top[idx[j+1,nx]],(1,0,0))
    corners=np.array([[wlo[0],wlo[1],zb],[whi[0],wlo[1],zb],[whi[0],whi[1],zb],[wlo[0],whi[1],zb]])
    tri=np.array([[0,2,1],[0,3,2]])   # normal hacia abajo
    V.append(corners);F.append(tri+off)
    return np.concatenate(V).astype(np.float32),np.concatenate(F).astype(np.int32),cov

def run(m,margin=5.0,budget=150000):
    geo=pickle.load(open(f"{S}/cache/{m['slug']}.pkl",'rb'))
    meta=pickle.load(open(f"{S}/cache/{m['slug']}.meta.pkl",'rb'))
    rows=meta['rows'];byg={r['guid']:r for r in rows}
    ls=meta['unit']
    items=[]
    for sid,g,c,v,f in geo:
        r=byg.get(g)
        if r is None: continue
        items.append([r,v.astype(np.float32)*ls,f])
    # ventana de recorte: la edificación sin terreno ni losas de sitio
    core=[it for it in items if it[0]['sysid'] in ('est','mur','car','cir','cub','uni')]
    if not core: core=items
    # alinea el edificio con los ejes (caja de sección y recorte del terreno quedan paralelos a la planta)
    P0=np.concatenate([it[1] for it in core])
    yaw=yaw_of(P0[:,:2]);c0=P0[:,:2].mean(0)
    if yaw:
        for it in items: it[1]=rot_xy(it[1],yaw,c0)
    print(m['slug'],'giro de alineación',yaw,'°')
    allv=np.concatenate([it[1] for it in core])
    lo=allv.min(0);hi=allv.max(0)
    wlo=np.array([lo[0]-margin,lo[1]-margin]);whi=np.array([hi[0]+margin,hi[1]+margin])
    kept=[]
    for it in items:
        r,v,f=it
        mn=v.min(0);mx=v.max(0)
        if mx[0]<wlo[0] or mn[0]>whi[0] or mx[1]<wlo[1] or mn[1]>whi[1]: continue
        if r['sysid'] in ('ter','lsa') and (mn[0]<wlo[0] or mx[0]>whi[0] or mn[1]<wlo[1] or mx[1]>whi[1]):
            v2,f2=clip_xy(v,f,wlo,whi)
            if len(f2)==0: continue
            it[1],it[2]=v2,f2
        kept.append(it)
    items=kept
    if m['slug'] in HF:
        tl=[it for it in items if it[0]['sysid']=='ter']
        nonter=[it for it in items if it[0]['sysid']!='ter']
        zfloor=float(min(it[1][:,2].min() for it in nonter))
        Vt,Ft,cov=terrain_block([(it[1],it[2]) for it in tl],wlo,whi,zfloor)
        if Vt is not None:
            carrier=max(tl,key=lambda it:len(it[2]))
            carrier[0]['hf']=True;carrier[1],carrier[2]=Vt,Ft
            items=[it for it in items if it[0]['sysid']!='ter' or it is carrier]
            print(m['slug'],'terreno continuo',len(Ft),'triángulos; cobertura del IFC en la ventana',round(100*cov,1),'%')
    if not m['keep_equip']: items=[it for it in items if it[0]['sysid']!='equ']
    k=1.0
    while True:
        tot=sum(target(len(it[2]),it[0]['sysid'],k) if not it[0].get('hf') else 0 for it in items)
        if tot<=budget or k<0.05: break
        k*=0.8
    for it in items:
        t=target(len(it[2]),it[0]['sysid'],k)
        if t<len(it[2]) and not it[0].get('hf'): it[1],it[2]=simp(it[1],it[2],t)
    allv=np.concatenate([it[1] for it in items])
    base=float(np.concatenate([it[1] for it in items if it[0]['sysid']!='ter'] or [allv])[:,2].min())
    cx=float((allv[:,0].min()+allv[:,0].max())/2);cy=float((allv[:,1].min()+allv[:,1].max())/2)
    def tr(v): return np.stack([v[:,0]-cx,v[:,2]-base,-(v[:,1]-cy)],1).astype(np.float32)
    for it in items: it[1]=tr(it[1])
    allv=np.concatenate([it[1] for it in items])
    omn=allv.min(0);omx=allv.max(0);sc=float((omx-omn).max())/65535.0*1.0000001
    # cubetas (sistema, nivel)
    buckets=collections.OrderedDict()
    for it in items:
        r=it[0];buckets.setdefault((SYS.index(r['sysid']),r['lvl']),[]).append(it)
    # tabla de textos
    strs=[];sidx={}
    def S_(x):
        if x is None or x=='': return -1
        x=str(x)
        if x not in sidx: sidx[x]=len(strs);strs.append(x)
        return sidx[x]
    # elementos: índice en tabla = orden de rows
    rowidx={r['guid']:i for i,r in enumerate(rows)}
    props=[];table=[]
    shown=set(it[0]['guid'] for it in items)
    npr=0
    for r in rows:
        p0=len(props)//3
        if r['guid'] in shown:
            for pn,k,v in r['props'][:70]: props+= [S_(pn),S_(k),S_(v)]
        pn_=len(props)//3-p0
        table.append([S_(r['tag']),S_(r['cls']),S_(r['ft']),r['lvl'],S_(r['mat']),MG.index(r['mg']),S_(r['phase']),S_(r['fun']),
                      SYS.index(r['sysid']),None if r['vol'] is None else round(r['vol'],4),None if r['area'] is None else round(r['area'],3),
                      None if r['len'] is None else round(r['len'],3),S_(r['cod']),p0,pn_,1 if r['guid'] in shown else 0,len(r['props'])])
    cells=[];bufP=[];bufI=[];offP=0;offI=0
    tris=0
    for (si,li),its in buckets.items():
        V=[];F=[];off=0;ranges=[];t0=0
        for r,v,f in its:
            V.append(v);F.append(f+off);off+=len(v)
            ranges.append([rowidx[r['guid']],t0,len(f)]);t0+=len(f)
        V=np.concatenate(V);F=np.concatenate(F)
        q=np.clip(np.round((V-omn)/sc),0,65535).astype(np.uint16)
        # delta + separación en planos de bytes
        d=np.diff(q.astype(np.int32),axis=0,prepend=np.zeros((1,3),np.int32)).astype(np.int64)
        d=(d & 0xffff).astype(np.uint16)
        pb=np.concatenate([(d & 0xff).astype(np.uint8).T.reshape(-1),(d>>8).astype(np.uint8).T.reshape(-1)]).tobytes()
        fl=F.reshape(-1).astype(np.int64);di=np.diff(fl,prepend=0)
        di=di.astype(np.int32).view(np.uint32)
        ib=np.concatenate([((di>>(8*k))&0xff).astype(np.uint8) for k in range(4)]).tobytes()
        cells.append({'s':si,'l':li,'nv':int(len(V)),'nt':int(len(F)),'op':offP,'oi':offI,'lp':len(pb),'li':len(ib),'r':ranges})
        bufP.append(pb);bufI.append(ib);offP+=len(pb);offI+=len(ib);tris+=len(F)
    # estadísticas medidas sobre el IFC completo
    N=len(rows)
    def pct(k): return round(100*k/N,1)
    st={'n':N,'shown':len(shown),'tris':tris,
        'types':len({r['ft'] for r in rows if r['ft']}),
        'pLvl':pct(sum(1 for r in rows if r['lvl']!=len(meta['levels'])-1)),
        'pType':pct(sum(1 for r in rows if r['ft'])),
        'pMat':pct(sum(1 for r in rows if r['mat'] and r['mat']!='<Unnamed>')),
        'pPhase':pct(sum(1 for r in rows if r['phase'])),
        'pQty':pct(sum(1 for r in rows if r['vol'] is not None or r['area'] is not None or r['len'] is not None)),
        'pFun':pct(sum(1 for r in rows if r['fun'])),
        'pCod':pct(sum(1 for r in rows if r['cod'])),
        'props':round(sum(len(r['props']) for r in rows)/N,1),
        'propsMax':max(len(r['props']) for r in rows),
        'bySys':{k:sum(1 for r in rows if r['sysid']==k) for k in SYS},
        'phases':dict(collections.Counter(r['phase'] or 'Sin fase' for r in rows)),
        'volTot':round(sum(r['vol'] or 0 for r in rows if r['sysid'] not in ('ter',)),2)}
    lv=[{'n':l['n'],'z':l['z'],'c':sum(1 for r in rows if r['lvl']==i)} for i,l in enumerate(meta['levels'])]
    # cuadro de metrados por sistema y tipo
    agg=collections.OrderedDict()
    for r in rows:
        k=(r['sysid'],r['ft'] or r['name'])
        a=agg.setdefault(k,[0,0.0,0.0,0.0,0]);a[0]+=1
        a[1]+=r['vol'] or 0;a[2]+=r['area'] or 0;a[3]+=r['len'] or 0
        a[4]+=1 if r['guid'] in shown else 0
    sched=[[SYS.index(k[0]),S_(k[1]),a[0],round(a[1],3),round(a[2],2),round(a[3],2),a[4]] for k,a in agg.items()]
    sched.sort(key=lambda x:(x[0],-x[2]))
    # encuadre: si el terreno es mucho más grande que la edificación, el visor se centra en la edificación
    fc=None
    cen=np.array([[(it[1][:,0].min()+it[1][:,0].max())/2,(it[1][:,2].min()+it[1][:,2].max())/2] for it in items if it[0]['sysid']!='ter'])
    if len(cen)>20:
        lo_,hi_=np.percentile(cen,1,axis=0)-3,np.percentile(cen,99,axis=0)+3
        fdiag=float(np.hypot(*(hi_-lo_)));adiag=float(np.linalg.norm(omx-omn))
        if adiag>1.8*fdiag: fc=[round(float((lo_[0]+hi_[0])/2),3),round(float((lo_[1]+hi_[1])/2),3),round(fdiag*.5*1.25,3)]
    head={'v':1,'base':round(base,3),'fc':fc,'slug':m['slug'],'file':meta['file'],'schema':meta['schema'],'app':meta['app'],
          'o':[float(x) for x in omn],'sc':sc,'bb':[[float(x) for x in omn],[float(x) for x in omx]],
          'lv':lv,'strs':strs,'el':table,'pr':props,'cells':cells,'st':st,'sched':sched,'sys':SYS,'mg':MG}
    jb=json.dumps(head,ensure_ascii=False,separators=(',',':')).encode('utf8')
    body=b'BIM1'+struct.pack('<III',len(jb),offP,offI)+jb+b''.join(bufP)+b''.join(bufI)
    z=zlib.compress(body,9)
    out=f"{S}/out/{m['slug']}.bim";import os;os.makedirs(f"{S}/out",exist_ok=True);open(out,'wb').write(z)
    print(m['slug'],'elementos IFC',N,'en 3D',len(shown),'tris',tris,'celdas',len(cells),'json',len(jb)//1024,'KB','pos',offP//1024,'KB','idx',offI//1024,'KB','→ archivo',len(z)//1024,'KB',flush=True)
    return head
if __name__=='__main__':
    sel=[int(x) for x in sys.argv[1:]] or [m['n'] for m in M]
    for m in M:
        if m['n'] in sel: run(m)
