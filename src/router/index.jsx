import React from 'react'
import { Route, Routes } from 'react-router-dom'
import RootLayout from '../layout/index.jsx'
import { Home, Camera, Sample } from '../pages'
import Report from '../components/PDF/Report.jsx'

export default function RootRoutes() {
    return (
        <Routes>
            <Route path="/" element={<RootLayout />}>
                <Route index element={<Home />} />
                <Route path="/camera" element={<Camera />} />
                <Route path="/sample" element={<Sample />} />
                <Route path="/report" element={<Report />} />
            </Route>
        </Routes>
    )
}