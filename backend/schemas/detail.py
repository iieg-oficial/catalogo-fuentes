import uuid

from pydantic import BaseModel

from schemas.base_de_datos import BaseDeDatosRead
from schemas.instrumento import InstrumentoRead
from schemas.producto import ProductoRead, ProductoWithProyecto
from schemas.proyecto import ProyectoRead
from schemas.tabla import TablaRead, TablaDetail as TablaWithProductos
from schemas.url import UrlRead
from schemas.archivo import ArchivoRead


class ProyectoDetail(ProyectoRead):
    productos: list[ProductoRead] = []


class ProductoDetail(ProductoWithProyecto):
    tablas: list[TablaRead] = []


class BaseDeDatosDetail(BaseDeDatosRead):
    tablas: list[TablaWithProductos] = []
    instrumentos: list[InstrumentoRead] = []


class InstrumentoDetailFull(InstrumentoRead):
    urls: list[UrlRead] = []


class UrlDetailFull(UrlRead):
    archivos: list[ArchivoRead] = []
