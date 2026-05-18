import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/NavBar';
import Footer from './Components/Footer';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Cart from './Pages/Cart';
import Wishlist from './Pages/Wishlist';
import Profile from './Pages/Profile';
import Services from './Pages/Services';
import ProductDetails from './Pages/ProductDetails';
import Category from './Pages/Category';
import Search from './Pages/Search';
import VendorDashboard from './Pages/VendorDashboard';
import VendorLogin from './Pages/VendorLogin';
import VendorRegister from './Pages/VendorRegister';
import ShippingPolicy from './Pages/ShippingPolicy';
import ReturnsExchanges from './Pages/ReturnsExchanges';
import FAQs from './Pages/FAQs';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import TermsOfService from './Pages/TermsOfService';
import ScrollToTop from './Components/ScrollToTop';
import { AppProvider } from './Context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/services" element={<Services />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/category/:name" element={<Category />} />
                <Route path="/search" element={<Search />} />
                <Route path="/vendor" element={<VendorDashboard />} />
                <Route path="/vendor-login" element={<VendorLogin />} />
                <Route path="/vendor-register" element={<VendorRegister />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/returns-exchanges" element={<ReturnsExchanges />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;