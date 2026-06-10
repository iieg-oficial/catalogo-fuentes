from schemas.archivo import ArchivoRead
from schemas.base_de_datos import BaseDeDatosRead
from schemas.dataset import DatasetRead
from schemas.distribucion import DistribucionRead
from schemas.edicion_dataset import EdicionDatasetRead
from schemas.fuente import FuenteRead
from schemas.informacion_tablas import InformacionTablasRead
from schemas.producto import ProductoRead
from schemas.proyecto import ProyectoRead


class ProyectoDetail(ProyectoRead):
    productos: list[ProductoRead] = []


class ProductoDetail(ProductoRead):
    informacion_tablas: list[InformacionTablasRead] = []


class FuenteDetail(FuenteRead):
    datasets: list[DatasetRead] = []


class DatasetDetail(DatasetRead):
    ediciones: list[EdicionDatasetRead] = []
    distribuciones: list[DistribucionRead] = []


class EdicionDatasetDetail(EdicionDatasetRead):
    distribuciones: list[DistribucionRead] = []


class DistribucionDetail(DistribucionRead):
    archivos: list[ArchivoRead] = []


class BaseDeDatosDetail(BaseDeDatosRead):
    informacion_tablas: list[InformacionTablasRead] = []
