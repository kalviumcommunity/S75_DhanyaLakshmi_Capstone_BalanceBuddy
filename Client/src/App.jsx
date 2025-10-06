import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Component/Signup';
import './App.css'
import Login from './Component/Login';
import Home from './Component/Home';
import FamilyDashboard from './Component/familyDashboard';
import SavingGoals from './Component/savingGoal'; 
import AddNewGoal from './Component/addNewGoals';
import Transaction from './Component/transaction';
import AddTransactionPage from "./Component/addTransactionForm";


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/home' element={<Home />} />
        <Route path="/family" element={<FamilyDashboard />} />
        <Route path="/family/goals" element={<SavingGoals />} />
        <Route path="/saving-goals" element={<SavingGoals />} />
        <Route path="/add-goal" element={<AddNewGoal />} />
        <Route path="/family/goals/new" element={<AddNewGoal />} />
        <Route path='/family/transactions' element={<Transaction/>}/>
        <Route path='/family/transactions/add-transaction' element={<AddTransactionPage />} />
      </Routes>
    </Router>
  )
}

export default App

































// import React from 'react'
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Signup from './Component/Signup';
// import Login  from './Component/Login';
// import Home from './Component/Home';
// import FamilyDashboard from './Component/familyDashboard';
// import SavingGoals from './Component/savingGoal'; 
//  import AddNewGoal from './Component/addNewGoals';
// import Transaction from './Component/transaction';
// import './App.css'

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path='/' element={<Signup />} />
//         <Route path='/login' element={<Login />} />
//         <Route path='/home' element={<Home />} />
//         <Route path="/family" element={<FamilyDashboard/>} />
//         <Route path="/saving-goals" element={<SavingGoals />} />
//         <Route path="/add-goal" element={<AddNewGoal />} />
//         <Route path="/family/goals/new" element={<AddNewGoal />} />
//         <Route path='/family/transactions' element={<Transaction/>}/> */

//       </Routes>
//     </Router>
//   )
// }

// export default App