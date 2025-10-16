import { Routes, Route, Navigate } from 'react-router-dom';
import { Protected } from './Protected';
import Home from './pages/Home';
import User from './pages/User';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Protected><Home/></Protected>} />
      <Route path="/user" element={<Protected><User/></Protected>} />
      <Route path="/admin" element={<Protected role="admin"><Admin/></Protected>} />
      <Route path="/profile" element={<Protected><Profile/></Protected>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
