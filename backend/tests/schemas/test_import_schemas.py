from schemas.import_ import ImportErrorDetail, ImportResult, ImportSkipped


def test_import_skipped_shape():
    skipped = ImportSkipped(fila=3, motivo="duplicado", valor="datos abiertos")
    assert skipped.fila == 3
    assert skipped.motivo == "duplicado"
    assert skipped.valor == "datos abiertos"


def test_import_error_detail_shape():
    error = ImportErrorDetail(mensaje="Fila 5: no se encontró proyecto 'x'", fila=5)
    assert error.bloqueado is True
    assert error.fila == 5
    assert error.mensaje == "Fila 5: no se encontró proyecto 'x'"


def test_import_error_detail_fila_opcional():
    error = ImportErrorDetail(mensaje="Ambigüedad en proyecto: 'x' coincide con más de un registro.")
    assert error.bloqueado is True
    assert error.fila is None


def test_import_result_shape_sin_omitidos():
    result = ImportResult(entidad="proyecto", creados=2, omitidos_duplicados=[])
    assert result.entidad == "proyecto"
    assert result.creados == 2
    assert result.omitidos_duplicados == []


def test_import_result_shape_con_omitidos():
    skipped = ImportSkipped(fila=1, motivo="duplicado", valor="datos")
    result = ImportResult(entidad="producto", creados=1, omitidos_duplicados=[skipped])
    dumped = result.model_dump()
    assert dumped["creados"] == 1
    assert dumped["omitidos_duplicados"][0]["fila"] == 1
    assert dumped["omitidos_duplicados"][0]["motivo"] == "duplicado"
