import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute'
import MerchantRoute from './components/MerchantRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Cart from './pages/Cart'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Marketplace from './pages/Marketplace'
import MerchantProducts from './pages/MerchantProducts'
import MerchantSales from './pages/MerchantSales'
import NotFound from './pages/NotFound'
import Orders from './pages/Orders'
import ProductDetails from './pages/ProductDetails'
import Register from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route element={<MerchantRoute />}>
          <Route path="/merchant/products" element={<MerchantProducts />} />
          <Route path="/merchant/sales" element={<MerchantSales />} />
        </Route>
      </Route>
      <Route path="/" element={<Marketplace />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
