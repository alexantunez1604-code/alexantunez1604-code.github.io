import sys,time,pickle,multiprocessing,numpy as np
import ifcopenshell,ifcopenshell.geom as G
from cfg import *
def run(m):
    t=time.time();f=ifcopenshell.open(m['ifc'])
    s=G.settings();s.set('use-world-coords',True)
    s.set('mesher-linear-deflection',0.01);s.set('mesher-angular-deflection',0.8)
    ex=list(f.by_type('IfcOpeningElement'))+list(f.by_type('IfcSpace'))+list(f.by_type('IfcAnnotation'))
    if not m['keep_equip']:
        for c in EQUIP:
            try: ex+=list(f.by_type(c))
            except Exception: pass
    it=G.iterator(s,f,multiprocessing.cpu_count(),exclude=ex)
    out=[];n=0
    if it.initialize():
        while True:
            sh=it.get();g=sh.geometry
            if len(g.faces)>0:
                e=f.by_id(sh.id)
                out.append((sh.id,e.GlobalId,e.is_a(),np.array(g.verts,dtype=np.float32).reshape(-1,3),np.array(g.faces,dtype=np.int32).reshape(-1,3)))
            n+=1
            if n%200==0: print(m['slug'],n,round(time.time()-t),'s',flush=True)
            if not it.next():break
    pickle.dump(out,open(f"{S}/cache/{m['slug']}.pkl",'wb'),protocol=4)
    tr=sum(len(o[4]) for o in out)
    print('DONE',m['slug'],'elements',len(out),'tris',tr,'secs',round(time.time()-t),flush=True)
if __name__=='__main__':
    sel=[int(x) for x in sys.argv[1:]] or [m['n'] for m in M]
    for m in M:
        if m['n'] in sel: run(m)
