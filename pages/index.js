import { firestore, model } from '@/firebase'
import { Toolbar, AppBar, Box, Button, Modal, Stack, TextField, Typography, IconButton, Checkbox, CircularProgress } from '@mui/material'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import CachedIcon from '@mui/icons-material/Cached'

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [showNewBox, setShowNewBox] = useState(false)
  const [checkedItems, setCheckedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [generatedRecipes, setGeneratedRecipes] = useState([])
  const [loading, setLoading] = useState(false)

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      })
    })
    setInventory(inventoryList)
  }

  const deleteItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item.name)
    await deleteDoc(docRef)
    await updateInventory()
  }

  const addItem = async (item, quantity) => {
    item = item.trim()
    item = item.toLowerCase()
    item = item.charAt(0).toUpperCase() + item.slice(1)
    quantity = parseInt(quantity, 10)

    const docRef = doc(collection(firestore, "inventory"), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const existingQuantity = docSnap.data().quantity
      await setDoc(docRef, { quantity: existingQuantity + quantity })
    } else {
      await setDoc(docRef, { quantity })
    }
    await updateInventory()
  }

  const editItem = async () => {
    const docRef = doc(collection(firestore, "inventory"), currentItem.name)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      let newName = itemName.trim().toLowerCase()
      newName = newName.charAt(0).toUpperCase() + newName.slice(1)

      await deleteDoc(docRef)
      await setDoc(doc(collection(firestore, "inventory"), newName), { quantity: parseInt(quantity, 10) })
      await updateInventory()
    }
    handleCloseEditModal()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleOpenEditModal = (item) => {
    setCurrentItem(item)
    setItemName(item.name)
    setQuantity(item.quantity)
    setOpenEditModal(true)
  }
  const handleCloseEditModal = () => {
    setItemName("")
    setQuantity(1)
    setCurrentItem(null)
    setOpenEditModal(false)
  }

  const handleShowNewBox = () => {
    setShowNewBox(!showNewBox)
  }

  const handleToggleItem = (itemName) => {
    const updatedCheckedItems = checkedItems.includes(itemName)
      ? checkedItems.filter(item => item !== itemName)
      : [...checkedItems, itemName]
    setCheckedItems(updatedCheckedItems)
    if (checkedItems.includes(itemName)) {
      setSelectAll(false)
    }
  }

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setCheckedItems([])
    } else {
      setCheckedItems(inventory.map(item => item.name))
    }
    setSelectAll(!selectAll)
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const generateRecipes = async () => {
    const ingredients = checkedItems.join(', ')
    const prompt = `Generate 3 unique recipes using the following ingredients. Each recipe should include its name, ingredients, and instructions. Add an @ in between each recipe (includes recipe name, ingredients and instructions) and use newline characters for each line in ingredients and instructions: ${ingredients}`
  
    try {
      setLoading(true)
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = await response.text()
      
      // Split recipes by "@"
      const recipeList = text.split('@').filter(recipe => recipe.trim() !== '')
      
      // Format each recipe
      const formattedRecipes = recipeList.slice(0, 3).map((recipe, index) => {
        // Format recipe text with line breaks for ingredients and instructions
        const formattedRecipe = recipe
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n')
  
        return {
          title: `${index + 1}. Recipe`,
          details: formattedRecipe
        }
      })
  
      setGeneratedRecipes(formattedRecipes)
    } catch (error) {
      console.error('Error generating recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" color="inherit">
            Pantry2Table
          </Typography>
        </Toolbar>
      </AppBar>
      <Box width="100vw" height="100vh" display="flex" justifyContent="center" alignItems="center" gap={2} flexDirection="column" bgcolor="#FFFFFF">
        <Modal open={open} onClose={handleClose}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="0px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{ transform: 'translate(-50%, -50%)' }}
          >
            <Typography variant='h6'>Add Item</Typography>
            <Stack width="100%" direction="row" spacing={2}>
              <TextField
                label="Item Name"
                variant='outlined'
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <TextField
                label="Quantity"
                variant='outlined'
                fullWidth
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Button
                variant='outlined'
                onClick={() => {
                  addItem(itemName, quantity)
                  setItemName("")
                  setQuantity(1)
                  handleClose()
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Modal open={openEditModal} onClose={handleCloseEditModal}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="0px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{ transform: 'translate(-50%, -50%)' }}
          >
            <Typography variant='h6'>Edit Item</Typography>
            <Stack width="100%" direction="column" spacing={2}>
              <TextField
                label="Item Name"
                variant='outlined'
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <TextField
                label="Quantity"
                variant='outlined'
                fullWidth
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Button
                variant='outlined'
                onClick={() => {
                  editItem()
                  setItemName("")
                  setQuantity(1)
                  handleCloseEditModal()
                }}
              >
                Update
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Box display="flex" justifyContent="space-between" width="90%">
          <Box border="0px solid #333" width={showNewBox ? "50%" : "100%"} transition="width 0.5s">
            <Box width="100%" height="150px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="center" border="5px solid #333">
              <Typography variant='h4' color="#333">Pantry Items</Typography>
            </Box>
            <Box padding={1}>
              <TextField
                label="Search"
                variant='outlined'
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </Box>
            <Stack width="100%" height="400px" spacing={2} overflow="auto" padding={1}>
              <Box mt={2} display="flex" alignItems="center" gap={0.5}>
                <Checkbox
                  checked={selectAll}
                  onChange={handleToggleSelectAll}
                  color="secondary"
                />
                <Typography variant='h6'>Select All</Typography>
              </Box>
              {filteredInventory.map(({ name, quantity }) => (
                <Box key={name} width="100%" minHeight="150px" display="flex" alignItems="center" justifyContent="space-between" bgcolor="#f0f0f0" padding={5}>
                  <Checkbox
                    checked={checkedItems.includes(name)}
                    onChange={() => handleToggleItem(name)}
                    color="secondary"
                  />
                  <Typography variant='h5' color="#333" textAlign="auto" margin="1">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant='h5' color="#333" textAlign="auto" margin="2">
                    {quantity}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <IconButton color="primary" onClick={() => handleOpenEditModal({ name, quantity })}>
                      <EditIcon style={{ fontSize: 60 }} />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => deleteItem({ name, quantity })}>
                      <DeleteIcon style={{ fontSize: 60 }} />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {showNewBox && (
            <Box border="0px solid #333" width="50%" transition="width 0.5s">
              <Box width="100%" height="150px" bgcolor="#A034AA" display="flex" alignItems="center" justifyContent="center" border="5px solid #333">
                <Typography variant='h4' color="#FFFFFF">Recipes</Typography>
              </Box>
              <Box width="100%" height="502px" display="flex" alignItems="center" justifyContent="center" bgcolor="#FFFFFF" flexDirection="column">
                <Typography variant='h6' color="#A034AA" marginLeft={2} marginRight={2}>Recipes using selected ingredients:</Typography>
                <Typography variant='h6' color="#000">{checkedItems.join(', ')}</Typography>
                <Box width="100%" height="80%" overflow="auto" display="flex" flexDirection="column" alignItems="center" gap={1}>
                  <IconButton color="secondary" onClick={generateRecipes}>
                    {loading ? <CircularProgress size={24} /> : <CachedIcon style={{ fontSize: 60 }} />}
                  </IconButton>
                  {generatedRecipes.length > 0 ? (
                    generatedRecipes.map((recipe, index) => (
                      <Box
                        key={index}
                        width="100%"
                        bgcolor="#f0f0f0"
                        padding={3}
                        margin={1}
                        display="flex"
                        flexDirection="column"
                        alignItems="flex-start"
                        borderRadius={2}
                        boxShadow={1}
                      >
                        <Typography variant='h6' color="#000" marginBottom={1}>
                          {recipe.title}
                        </Typography>
                        <Typography variant='body1' color="#000" component="pre">
                          {recipe.details}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant='h6' color="#000">No matching recipes</Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        <Box display="flex" gap={2}>
          <IconButton color="primary" onClick={handleOpen}>
            <AddCircleIcon style={{ fontSize: 60 }} />
          </IconButton>
          <IconButton color="secondary" onClick={handleShowNewBox}>
            <RestaurantIcon style={{ fontSize: 60 }} />
          </IconButton>
        </Box>
      </Box>
    </>
  )
}
