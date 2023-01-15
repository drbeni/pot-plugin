import React, { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import MaterialReactTable from "material-react-table"
import { MRT_Localization_DE } from "material-react-table/locales/de"
import { Box, IconButton, Snackbar, Button } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import FileUploadIcon from "@mui/icons-material/FileUpload"
import { ExportToCsv } from "export-to-csv"
import ImportProducts from "./products/ImportProducts"
import ProducerImportProducts from "./products/ProducerImportProducts"
const __ = wp.i18n.__

const Products = () => {
  const [products, setProducts] = useState()
  const [categories, setCategories] = useState()
  const [productsLoading, setProductsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState({
    message: null,
    type: null,
    active: false
  })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [producerImportModalOpen, setProducerImportModalOpen] = useState(false)

  useEffect(() => {
    axios
      .get(`${appLocalizer.apiUrl}/foodcoop/v1/getProducts`)
      .then(function (response) {
        let reArrangeProductData = []
        if (response.data) {
          const res = JSON.parse(response.data)
          res[0].map(p => {
            let productToDo = {}
            productToDo.name = p.name
            productToDo.price = p.price
            productToDo.unit = p._einheit
            productToDo.lot = p._gebinde
            productToDo.producer = p._lieferant
            productToDo.origin = p._herkunft
            productToDo.category = p.category_name
            productToDo.id = p.id

            reArrangeProductData.push(productToDo)
          })
          setProducts(reArrangeProductData)
          setCategories(res[1])
          setProductsLoading(false)
        }
      })
      .catch(error => console.log(error))
  }, [])

  /**
   * Product Table
   */

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: __("ID", "fcplugin"),
        enableEditing: false,
        size: 50
      },
      {
        accessorKey: "name",
        header: __("Produkt", "fcplugin")
      },
      {
        accessorKey: "price",
        header: __("Preis", "fcplugin"),
        size: 80
      },
      {
        accessorKey: "unit",
        header: __("Einheit", "fcplugin"),
        size: 80
      },
      {
        accessorKey: "lot",
        header: __("Gebindegrösse", "fcplugin"),
        size: 80
      },
      {
        accessorKey: "producer",
        header: __("Produzent", "fcplugin")
      },
      {
        accessorKey: "origin",
        header: __("Herkunft", "fcplugin")
      },
      {
        accessorKey: "category",
        id: "category_id",
        header: __("Kategorie", "fcplugin"),
        enableEditing: false
      }
    ],
    []
  )

  async function handleSaveRow({ exitEditingMode, row, values }) {
    products[row.index] = values
    axios
      .post(
        `${appLocalizer.apiUrl}/foodcoop/v1/postProductUpdate`,
        {
          updatedValues: values,
          id: values.id
        },
        {
          headers: {
            "X-WP-Nonce": appLocalizer.nonce
          }
        }
      )
      .then(function (response) {
        if (response.data) {
          console.log(response)
        }
        response.status == 200 &&
          setStatusMessage({
            message: JSON.parse(response.data) + " " + __("wurde gespeichert.", "fcplugin"),
            type: "successStatus",
            active: true
          })
      })
      .catch(error => console.log(error))

    // update table values
    setProducts([...products])
    exitEditingMode() //required to exit editing mode
  }

  const handleDeleteRow = useCallback(
    row => {
      if (!confirm(row.getValue("name") + " " + __("löschen?", "fcplugin"))) {
        return
      }

      axios
        .post(
          `${appLocalizer.apiUrl}/foodcoop/v1/postProductDelete`,
          {
            name: row.getValue("name"),
            id: row.getValue("id")
          },
          {
            headers: {
              "X-WP-Nonce": appLocalizer.nonce
            }
          }
        )
        .then(function (response) {
          if (response.data) {
            console.log(response)
          }
          response.status == 200 &&
            setStatusMessage({
              message: JSON.parse(response.data) + " " + __("wurde gelöscht.", "fcplugin"),
              type: "successStatus",
              active: true
            })
        })
        .catch(error => console.log(error))

      products.splice(row.index, 1)
      setProducts([...products])
    },
    [products]
  )

  useEffect(() => {
    setTimeout(() => {
      setStatusMessage({
        message: null,
        type: null,
        active: false
      })
    }, 15000)
  }, [statusMessage])

  /**
   * Export to CSV
   */
  const csvOptions = {
    fieldSeparator: ";",
    quoteStrings: '"',
    decimalSeparator: ".",
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: true,
    filename: "foodcoop-products-" + new Date().toLocaleDateString() + new Date().toLocaleTimeString()
  }

  const csvExporter = new ExportToCsv(csvOptions)

  const handleExportData = () => {
    csvExporter.generateCsv(products)
  }

  return (
    <>
      {statusMessage.active && <div className={`statusMessage ${statusMessage.type}`}>{statusMessage.message}</div>}
      <MaterialReactTable
        columns={columns}
        data={products ?? []}
        state={{ isLoading: productsLoading }}
        localization={MRT_Localization_DE}
        enableRowActions
        positionActionsColumn="first"
        displayColumnDefOptions={{
          "mrt-row-actions": {
            header: "",
            Cell: ({ row, table }) => (
              <Box>
                <IconButton>
                  <EditIcon onClick={() => table.setEditingRow(row)} />
                </IconButton>
                <IconButton>
                  <DeleteIcon onClick={() => handleDeleteRow(row)} />
                </IconButton>
              </Box>
            )
          }
        }}
        editingMode={"modal"}
        enableEditing
        onEditingRowSave={handleSaveRow}
        enableFullScreenToggle={false}
        initialState={{ density: "compact" }}
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <Box sx={{ display: "flex", gap: "1rem", p: "0.5rem", flexWrap: "wrap" }}>
            <Button color="primary" onClick={handleExportData} startIcon={<FileDownloadIcon />} variant="outlined" size="small" disabled={productsLoading}>
              {__("Exportieren", "fcplugin")}
            </Button>
            <Button color="primary" onClick={() => setImportModalOpen(true)} startIcon={<FileUploadIcon />} variant="outlined" size="small" disabled={productsLoading}>
              {__("Importieren", "fcplugin")}
            </Button>
            <Button color="primary" onClick={() => setProducerImportModalOpen(true)} startIcon={<LocalShippingIcon />} variant="outlined" size="small" disabled={productsLoading}>
              {__("Lieferant importieren", "fcplugin")}
            </Button>
          </Box>
        )}
      />
      {importModalOpen && <ImportProducts setModalClose={setImportModalOpen} categories={categories} />}
      {producerImportModalOpen && <ProducerImportProducts setModalClose={setProducerImportModalOpen} categories={categories} />}
    </>
  )
}

export default Products