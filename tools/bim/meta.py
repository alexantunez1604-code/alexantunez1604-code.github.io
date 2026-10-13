import sys,json,re,collections,math
import ifcopenshell, ifcopenshell.util.element as UE, ifcopenshell.util.unit as UU
from cfg import *

def sysof(cls,cat,name):
    c=(cat or '').lower(); n=(name or '').lower()
    if cls in ('IfcColumn','IfcBeam','IfcFooting','IfcPile','IfcReinforcingBar','IfcElementAssembly','IfcTendon'): return 'est'
    if cls=='IfcMember':
        if 'muro cortina' in c: return 'car'
        if 'escalera' in c: return 'cir'
        return 'est'
    if cls=='IfcPlate':
        if 'muro cortina' in c or 'panel' in n: return 'car'
        return 'uni'
    if cls=='IfcSlab':
        if re.search(r'c[eé]sped|tierra|terreno|grass|topogr',n+' '+c): return 'ter'
        if 'cimentaci' in c: return 'est'
        if 'cubierta' in c: return 'cub'
        if 'escalera' in c: return 'cir'
        return 'lsa'
    if cls in ('IfcWall','IfcWallStandardCase'): return 'mur'
    if cls=='IfcCurtainWall': return 'car'
    if cls in ('IfcRoof','IfcCovering'): return 'cub'
    if cls in ('IfcDoor','IfcWindow'): return 'car'
    if cls in ('IfcStair','IfcStairFlight','IfcRailing','IfcRamp','IfcRampFlight'): return 'cir'
    if cls in ('IfcMechanicalFastener','IfcFastener','IfcDiscreteAccessory'): return 'uni'
    if cls=='IfcGeographicElement': return 'ter'
    if cls=='IfcPipeSegment': return 'cub' if 'canal' in c or 'cubierta' in c else 'equ'
    if cls=='IfcBuildingElementProxy':
        if re.search(r'uni[oó]n|perno|sincho|anclaje|conexi|placa|soldad',n+' '+c): return 'uni'
        if 'bordes de losa' in c: return 'lsa'
        if 'equipo' in c: return 'equ'
        if 'armaz' in c: return 'uni'
        return 'otr'
    if cls in ('IfcFurniture','IfcFurnishingElement','IfcFlowTerminal','IfcLightFixture','IfcElectricAppliance','IfcSanitaryTerminal','IfcDistributionElement'): return 'equ'
    return 'otr'

MATG=[('con',r'hormig|concret|cemento|losa maciza'),('alb',r'ladrillo|albañ|bloque|block|kingkong|mamposter|adobe|quincha|tarraj'),
      ('mad',r'madera|quinilla|wood|bois|teck|tornillo|anacaspi|cerez|madeira|glulam|listel|listones|tablas'),
      ('ace',r'acero|steel|acciaio|metal|alumin|corten|cromo|inox|hierro|stainless|silver|grado 60|die-cast'),
      ('vid',r'vidrio|glass|vidro|cristal|mampara'),
      ('aca',r'pintura|peinture|porcelan|microcemento|tecido|textil|tela|silicona|substrato|grass|césped|cesped|tierra|grava|vereda|rock wool')]
def matgroup(m):
    if not m or m=='<Unnamed>': return 'sin'
    s=m.lower()
    for k,p in MATG:
        if re.search(p,s): return k
    return 'otr'

SKIP_KEYS={'id'}
def fmt(v):
    if isinstance(v,bool): return 'Sí' if v else 'No'
    if isinstance(v,float):
        if abs(v)>=1000: return f'{v:.1f}'
        r=round(v,4); return ('%g'%r)
    return str(v)[:90]

def run(m):
    f=ifcopenshell.open(m['ifc'])
    ls=UU.calculate_unit_scale(f)
    prj=f.by_type('IfcProject')[0]
    app=f.by_type('IfcApplication')[0].ApplicationFullName if f.by_type('IfcApplication') else ''
    # niveles unificados
    st=[(s.Name or '',float(s.Elevation or 0)*ls,s) for s in f.by_type('IfcBuildingStorey')]
    cnt=collections.Counter()
    els=[e for e in f.by_type('IfcElement') if not e.is_a('IfcOpeningElement')]
    cont={}
    for e in els:
        c=UE.get_container(e)
        while c is not None and not c.is_a('IfcBuildingStorey'):
            c=UE.get_container(c) if c.is_a('IfcSpatialElement') else None
            if c is not None and not c.is_a('IfcBuildingStorey'): c=None
        cont[e.id()]=c
        cnt[c.Name if c else None]+=1
    # agrupar por elevación (2 cm), nombre = el de más elementos
    items=sorted({(n,round(el,2)) for n,el,_ in st},key=lambda x:x[1])
    groups=[]
    for n,el in items:
        for g in groups:
            if abs(g['elev']-el)<=0.02: g['names'].append(n); break
        else: groups.append({'elev':el,'names':[n]})
    for g in groups:
        g['name']=max(g['names'],key=lambda n:cnt.get(n,0))
    # unir niveles con el mismo nombre que vienen de vínculos con otra cota
    merged=[]
    for g in groups:
        for h in merged:
            if h['name'].strip().lower()==g['name'].strip().lower() or any(a.strip().lower()==b.strip().lower() for a in h['names'] for b in g['names']):
                if cnt.get(g['name'],0)>cnt.get(h['name'],0): h['elev']=g['elev']
                h['names']+=g['names']; break
        else: merged.append(g)
    groups=sorted(merged,key=lambda g:g['elev'])
    nm2g={}
    for gi,g in enumerate(groups):
        for n in g['names']: nm2g[n]=gi
    levels=[{'n':g['name'],'z':round(g['elev'],2)} for g in groups]
    ext=len(levels); levels.append({'n':'Exterior / sin nivel','z':None})
    rows=[]
    for e in els:
        ps=UE.get_psets(e)
        ot=ps.get('Otros',{})
        cat=ot.get('Categoría'); fam=ot.get('Nombre de familia') or ot.get('Familia')
        ft=ot.get('Familia y tipo')
        t=UE.get_type(e)
        tname=ps.get('Datos de identidad',{}).get('Nombre de tipo') or (t.Name if t else None) or ot.get('Tipo')
        ftype=ft or (t.Name if t else e.Name)
        c=cont[e.id()]
        lv=nm2g.get(c.Name,ext) if c else ext
        mats=[getattr(x,'Name',None) for x in UE.get_materials(e)]
        mat=next((x for x in mats if x and x!='<Unnamed>'),None) or (mats[0] if mats else None)
        ph=ps.get('Proceso por fases',{})
        cn=ps.get('Construcción',{})
        co=ps.get('Cotas',{})
        def num(k):
            v=co.get(k); return float(v) if isinstance(v,(int,float)) and not isinstance(v,bool) else None
        vol=num('Volumen'); area=num('Área'); 
        ln=num('Longitud') or num('Longitud del sistema') or num('Longitud de corte')
        props=[]
        for pn,d in ps.items():
            for k,v in d.items():
                if k in SKIP_KEYS or v is None or v=='' or v in ('<Ninguno>','<no asociado>'): continue
                props.append((pn,k,fmt(v)))
        rows.append(dict(guid=e.GlobalId,step=e.id(),tag=e.Tag,cls=e.is_a(),cat=cat,fam=fam,typ=tname,ft=ftype,lvl=lv,
            mat=mat,mats=[x for x in mats if x],mg=matgroup(mat),phase=ph.get('Fase de creación'),fun=cn.get('Función'),
            sysid=sysof(e.is_a(),cat,ftype),vol=vol,area=area,len=ln,cod=ps.get('Datos de identidad',{}).get('Código de montaje'),
            name=e.Name,props=props))
    return dict(slug=m['slug'],file=m['ifc'].split('/')[-1],schema=f.schema,app=app,unit=ls,levels=levels,rows=rows)
if __name__=='__main__':
    import pickle
    sel=[int(x) for x in sys.argv[1:]] or [m['n'] for m in M]
    for m in M:
        if m['n'] in sel:
            r=run(m); pickle.dump(r,open(f"{S}/cache/{m['slug']}.meta.pkl",'wb'),protocol=4)
            print(m['slug'],'rows',len(r['rows']),'unit',r['unit'],'levels',r['levels'],flush=True)
