from schemas.archivo import ArchivoRead
from schemas.base_de_datos import BaseDeDatosRead
from schemas.dataset import DatasetRead
from schemas.distribucion import DistribucionRead
from schemas.edicion_dataset import EdicionDatasetRead
from schemas.fuente import FuenteRead
from schemas.informacion_tablas import InformacionTablasRead
from schemas.producto import ProductoRead
from schemas.producto_tabla import ProductoTablaRead
from schemas.proyecto import ProyectoRead


class ProyectoDetail(ProyectoRead):
    productos: list[ProductoRead] = []


class ProductoDetail(ProductoRead):
    producto_tablas: list[ProductoTablaRead] = []


class FuenteDetail(FuenteRead):
    datasets: list[DatasetRead] = []


class DatasetDetail(DatasetRead):
    ediciones: list[EdicionDatasetRead] = []
    bases_de_datos: list[BaseDeDatosRead] = []


class EdicionDatasetDetail(EdicionDatasetRead):
    distribuciones: list[DistribucionRead] = []


class DistribucionDetail(DistribucionRead):
    archivos: list[ArchivoRead] = []


class BaseDeDatosDetail(BaseDeDatosRead):
    informacion_tablas: list[InformacionTablasRead] = []
