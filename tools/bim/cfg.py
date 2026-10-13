import os
# Carpeta con los IFC (ver 02_INSUMOS/modelos_ifc/LEEME.txt) y carpeta de trabajo; ambas se pueden cambiar con variables de entorno
U=os.environ.get("BIM_IFC_DIR", r"C:\Users\alexa\Desktop\Portafolio\3D_para_revisar")
S=os.environ.get("BIM_WORK_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "_trabajo"))
M=[
 dict(n=1,slug='casa-violeta',ifc=U+"/01_Casa_Violeta/CASA VIOLETA.ifc",keep_equip=True),
 dict(n=2,slug='pumarrinri-banos',ifc=U+"/02_Pumarrinri_Amazon_Lodge-Baños de Recepción/Baños nuevos pumarrinri.ifc",keep_equip=True),
 dict(n=3,slug='pumarrinri-mod3a',ifc=U+"/03_Pumarrinri_Amazon_Lodge-MOD3A/2025.05.ifc",keep_equip=False),
 dict(n=4,slug='gocta-1a',ifc=U+"/04_Gocta_Andes_Lodge - MOD1A/ARQ_BLOQUE 1A proyecto.ifc",keep_equip=False),
 dict(n=5,slug='gocta-1b',ifc=U+"/05_Gocta_Andes_Lodge - MOD1B/ARQ_BLOQUE 1B.ifc",keep_equip=False),
 dict(n=6,slug='casa-h',ifc=U+"/06_Casa H/00_B.ifc",keep_equip=False),
 dict(n=7,slug='hotel-tucan',ifc=U+"/07_Hotel_Tucan_Suites/01_TC.ifc",keep_equip=False),
 dict(n=8,slug='casa-nilo',ifc=U+"/08_Casa Nilo/CASA NILO_OBRA.ifc",keep_equip=False),
 dict(n=9,slug='mastil-2',ifc=U+"/09_Mástil 2/ARQ_MASTIL2.ifc",keep_equip=False),
 dict(n=10,slug='plantilla-jjcc',ifc=U+"/10_Plantilla estructural/JJCC_PLANTILLA DE ESTRUCTURAS_LOD300_V01.ifc",keep_equip=False),
]
EQUIP=('IfcFurniture','IfcFurnishingElement','IfcFlowTerminal','IfcLightFixture','IfcPipeSegment','IfcElectricAppliance','IfcSanitaryTerminal','IfcDistributionElement')
