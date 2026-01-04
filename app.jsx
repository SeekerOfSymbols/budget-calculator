
const BudgetCalculator = () => {
  const [activeTab, setActiveTab] = useState('allocate');
  const [paycheck, setPaycheck] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deductTax, setDeductTax] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const TAX_RATE = 0.33;
  const MIN_CHARITY_PERCENT = 10;
  
  // Ordered keys for display
  const mainCategoryOrder = ['fixed', 'flexible', 'savings', 'charity'];
  const savingsCategoryOrder = ['rainyDay', 'retirement', 'hsa', 'bigPurchases'];

  const [mainAllocations, setMainAllocations] = useState({
    fixed: 50,
    savings: 25,
    flexible: 15,
    charity: 10
  });

  const [savingsAllocations, setSavingsAllocations] = useState({
    rainyDay: 40,
    retirement: 30,
    hsa: 15,
    bigPurchases: 15
  });

  const [accounts, setAccounts] = useState({
    fixed: { balance: 0, goal: 0, monthlySpend: 0 },
    flexible: { balance: 0, goal: 0, monthlySpend: 0 },
    charity: { balance: 0, goal: 0, monthlySpend: 0 },
    rainyDay: { balance: 0, goal: 0, monthlySpend: 0 },
    retirement: { balance: 0, goal: 0, monthlySpend: 0 },
    hsa: { balance: 0, goal: 0, monthlySpend: 0 },
    bigPurchases: { balance: 0, goal: 0, monthlySpend: 0 }
  });

  const [incomeType, setIncomeType] = useState('regular');
  const [regularPaycheck, setRegularPaycheck] = useState('');
  const [paychecksPerMonth, setPaychecksPerMonth] = useState(2);
  
  // Freelance settings
  const [freelancePaycheck, setFreelancePaycheck] = useState('');
  const [freelanceDeductTax, setFreelanceDeductTax] = useState(true);
  const [expectedMonthlyBilling, setExpectedMonthlyBilling] = useState('');
  const [expectedBillingMonths, setExpectedBillingMonths] = useState(3);
  const [freelanceShowResults, setFreelanceShowResults] = useState(false);

  const mainLabels = {
    fixed: 'Fixed',
    savings: 'Savings',
    flexible: 'Flexible',
    charity: 'Charity'
  };

  const mainLabelsFull = {
    fixed: 'Fixed (Bills & Rent)',
    savings: 'Savings',
    flexible: 'Flexible (Spending)',
    charity: 'Charity'
  };

  const savingsLabels = {
    rainyDay: 'Rainy Day',
    retirement: 'Retirement',
    hsa: 'HSA',
    bigPurchases: 'Big Purchases'
  };

  const savingsLabelsFull = {
    rainyDay: 'Rainy Day Fund',
    retirement: 'Retirement',
    hsa: 'Health Savings (HSA)',
    bigPurchases: 'Big Purchases'
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const keys = ['mainAllocations', 'savingsAllocations', 'accounts', 'regularPaycheck', 'paychecksPerMonth', 'paycheck', 'incomeType', 'deductTax', 'expectedMonthlyBilling', 'expectedBillingMonths', 'freelanceDeductTax'];
        for (const key of keys) {
          try {
            const result = await window.storage.get(key);
            if (result && result.value) {
              const parsed = JSON.parse(result.value);
              switch (key) {
                case 'mainAllocations': setMainAllocations(parsed); break;
                case 'savingsAllocations': setSavingsAllocations(parsed); break;
                case 'accounts': setAccounts(parsed); break;
                case 'regularPaycheck': setRegularPaycheck(parsed); break;
                case 'paychecksPerMonth': setPaychecksPerMonth(parsed); break;
                case 'paycheck': setPaycheck(parsed); break;
                case 'incomeType': setIncomeType(parsed); break;
                case 'deductTax': setDeductTax(parsed); break;
                case 'expectedMonthlyBilling': setExpectedMonthlyBilling(parsed); break;
                case 'expectedBillingMonths': setExpectedBillingMonths(parsed); break;
                case 'freelanceDeductTax': setFreelanceDeductTax(parsed); break;
              }
            }
          } catch (e) {}
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const saveData = async () => {
      try {
        await window.storage.set('mainAllocations', JSON.stringify(mainAllocations));
        await window.storage.set('savingsAllocations', JSON.stringify(savingsAllocations));
        await window.storage.set('accounts', JSON.stringify(accounts));
        await window.storage.set('regularPaycheck', JSON.stringify(regularPaycheck));
        await window.storage.set('paychecksPerMonth', JSON.stringify(paychecksPerMonth));
        await window.storage.set('paycheck', JSON.stringify(paycheck));
        await window.storage.set('incomeType', JSON.stringify(incomeType));
        await window.storage.set('deductTax', JSON.stringify(deductTax));
        await window.storage.set('expectedMonthlyBilling', JSON.stringify(expectedMonthlyBilling));
        await window.storage.set('expectedBillingMonths', JSON.stringify(expectedBillingMonths));
        await window.storage.set('freelanceDeductTax', JSON.stringify(freelanceDeductTax));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };
    saveData();
  }, [mainAllocations, savingsAllocations, accounts, regularPaycheck, paychecksPerMonth, paycheck, incomeType, deductTax, expectedMonthlyBilling, expectedBillingMonths, freelanceDeductTax, isLoading]);

  const mainTotal = Object.values(mainAllocations).reduce((a, b) => a + b, 0);
  const savingsTotal = Object.values(savingsAllocations).reduce((a, b) => a + b, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const roundToFive = (value) => Math.round(value / 5) * 5;

  const getNetPaycheck = () => {
    const gross = parseFloat(paycheck) || 0;
    return deductTax ? gross * (1 - TAX_RATE) : gross;
  };

  const getFreelanceNetPaycheck = () => {
    const gross = parseFloat(freelancePaycheck) || 0;
    return freelanceDeductTax ? gross * (1 - TAX_RATE) : gross;
  };

  const getMonthlyIncome = () => {
    if (incomeType === 'irregular') return null;
    const paycheckAmount = parseFloat(regularPaycheck) || 0;
    return paycheckAmount * paychecksPerMonth;
  };

  const getExpectedMonthlyNet = () => {
    const billing = parseFloat(expectedMonthlyBilling) || 0;
    return freelanceDeductTax ? billing * (1 - TAX_RATE) : billing;
  };

  const getTotalMonthlySpend = () => {
    return (accounts.fixed?.monthlySpend || 0) + (accounts.flexible?.monthlySpend || 0);
  };

  const getTotalBalance = () => {
    return (accounts.fixed?.balance || 0) + (accounts.flexible?.balance || 0);
  };

  const getRunwayMonths = () => {
    const totalBalance = getTotalBalance();
    const monthlySpend = getTotalMonthlySpend();
    if (monthlySpend <= 0) return null;
    return totalBalance / monthlySpend;
  };

  const getRunwayWithRainyDay = () => {
    const totalBalance = getTotalBalance() + (accounts.rainyDay?.balance || 0);
    const monthlySpend = getTotalMonthlySpend();
    if (monthlySpend <= 0) return null;
    return totalBalance / monthlySpend;
  };

  // Forecast runway considering expected income - FIXED to always show months
  const getForecastRunway = () => {
    const monthlySpend = getTotalMonthlySpend();
    if (monthlySpend <= 0) return null;
    
    let monthlyIncome = 0;
    if (incomeType === 'regular') {
      monthlyIncome = getMonthlyIncome() || 0;
    } else {
      monthlyIncome = getExpectedMonthlyNet() || 0;
    }
    
    if (monthlyIncome <= 0) return null;
    
    // Calculate how much goes to fixed+flexible accounts
    const operatingPercent = (mainAllocations.fixed + mainAllocations.flexible) / 100;
    const monthlyToOperating = monthlyIncome * operatingPercent;
    
    const netMonthlyFlow = monthlyToOperating - monthlySpend;
    const currentBalance = getTotalBalance();
    
    if (netMonthlyFlow >= 0) {
      // Growing - show how many months of buffer we're building
      // Calculate months until we hit a comfortable 6-month runway
      const targetBalance = monthlySpend * 6;
      const gap = targetBalance - currentBalance;
      if (gap <= 0) {
        return { type: 'growing', months: null, netFlow: netMonthlyFlow, message: 'Healthy' };
      }
      const monthsToTarget = Math.ceil(gap / netMonthlyFlow);
      return { type: 'growing', months: monthsToTarget, netFlow: netMonthlyFlow, message: `${monthsToTarget}mo to 6mo buffer` };
    }
    
    // Declining - how many months until broke
    const monthsUntilBroke = currentBalance / Math.abs(netMonthlyFlow);
    return { type: 'declining', months: monthsUntilBroke, netFlow: netMonthlyFlow, message: `${monthsUntilBroke.toFixed(1)}mo` };
  };

  // Calculate months to goal for a specific account
  const calculateMonthsToGoal = (key, isSavings = false) => {
    const account = accounts[key];
    if (!account || account.goal <= 0) return null;
    
    let monthlyIncome = 0;
    if (incomeType === 'regular') {
      const paycheckAmount = parseFloat(regularPaycheck) || 0;
      if (paycheckAmount <= 0) return null;
      monthlyIncome = paycheckAmount * paychecksPerMonth;
    } else {
      monthlyIncome = getExpectedMonthlyNet();
      if (monthlyIncome <= 0) return null;
    }
    
    let monthlyContribution;
    if (isSavings) {
      const savingsPercent = mainAllocations.savings / 100;
      const subPercent = savingsAllocations[key] / 100;
      monthlyContribution = monthlyIncome * savingsPercent * subPercent;
    } else if (key === 'savings') {
      return null;
    } else {
      monthlyContribution = monthlyIncome * (mainAllocations[key] / 100);
    }

    const monthlySpend = account.monthlySpend || 0;
    const netMonthly = monthlyContribution - monthlySpend;
    const gap = account.goal - account.balance;

    if (gap <= 0) return { months: 0, message: 'Done!' };
    if (netMonthly <= 0) return { months: Infinity, message: 'Over budget' };

    const months = Math.ceil(gap / netMonthly);
    return { months, message: `${months}mo` };
  };

  // Get active goals with full details
  const getActiveGoals = () => {
    const active = [];
    
    ['fixed', 'flexible'].forEach(key => {
      const account = accounts[key];
      if (account?.goal > 0) {
        const progress = (account.balance / account.goal) * 100;
        if (progress < 100) {
          const monthsInfo = calculateMonthsToGoal(key, false);
          active.push({
            key,
            name: mainLabelsFull[key],
            balance: account.balance,
            goal: account.goal,
            remaining: account.goal - account.balance,
            progress,
            monthsInfo,
            type: 'main'
          });
        }
      }
    });
    
    savingsCategoryOrder.forEach(key => {
      const account = accounts[key];
      if (account?.goal > 0) {
        const progress = (account.balance / account.goal) * 100;
        if (progress < 100) {
          const monthsInfo = calculateMonthsToGoal(key, true);
          active.push({
            key,
            name: savingsLabelsFull[key],
            balance: account.balance,
            goal: account.goal,
            remaining: account.goal - account.balance,
            progress,
            monthsInfo,
            type: 'savings'
          });
        }
      }
    });
    
    return active.sort((a, b) => b.progress - a.progress).slice(0, 4);
  };

  const getGoalSummary = () => {
    let totalGoal = 0;
    let totalBalance = 0;
    
    ['fixed', 'flexible'].forEach(key => {
      totalGoal += accounts[key]?.goal || 0;
      totalBalance += accounts[key]?.balance || 0;
    });
    
    savingsCategoryOrder.forEach(key => {
      totalGoal += accounts[key]?.goal || 0;
      totalBalance += accounts[key]?.balance || 0;
    });
    
    return {
      totalGoal,
      totalBalance,
      progress: totalGoal > 0 ? (totalBalance / totalGoal) * 100 : 0
    };
  };

  const calculateAllocations = (amount, withTax = false, taxRate = TAX_RATE) => {
    if (amount <= 0) return { main: {}, savings: {}, taxWithheld: 0 };
    
    const netAmount = withTax ? amount * (1 - taxRate) : amount;
    const taxWithheld = withTax ? amount * taxRate : 0;
    
    const main = {};
    mainCategoryOrder.forEach(key => {
      main[key] = (netAmount * mainAllocations[key]) / 100;
    });

    const savingsAmount = main.savings || 0;
    const savings = {};
    savingsCategoryOrder.forEach(key => {
      savings[key] = (savingsAmount * savingsAllocations[key]) / 100;
    });

    return { main, savings, taxWithheld, netAmount };
  };

  const addToBalances = (results) => {
    if (!results || !results.netAmount) return;

    const newAccounts = { ...accounts };
    
    ['fixed', 'flexible', 'charity'].forEach(key => {
      newAccounts[key] = {
        ...newAccounts[key],
        balance: (newAccounts[key]?.balance || 0) + (results.main[key] || 0)
      };
    });

    savingsCategoryOrder.forEach(key => {
      newAccounts[key] = {
        ...newAccounts[key],
        balance: (newAccounts[key]?.balance || 0) + (results.savings[key] || 0)
      };
    });

    setAccounts(newAccounts);
    setLastAdded({
      amount: results.netAmount,
      results: results
    });
    setShowSuccess(true);
    // Removed auto-timeout - user must dismiss manually
  };

  const handleRegularAddToBalances = () => {
    const results = calculateAllocations(parseFloat(paycheck) || 0, deductTax);
    addToBalances(results);
    setPaycheck('');
    setShowResults(false);
  };

  const handleFreelanceAddToBalances = () => {
    const results = calculateAllocations(parseFloat(freelancePaycheck) || 0, freelanceDeductTax);
    addToBalances(results);
    setFreelancePaycheck('');
    setFreelanceShowResults(false);
  };

  // Smart optimizer that considers savings goals and keeps charity at minimum
  const calculateOptimalAllocations = () => {
    let monthlyIncome = 0;
    if (incomeType === 'regular') {
      const paycheckAmount = parseFloat(regularPaycheck) || 0;
      if (paycheckAmount <= 0) return null;
      monthlyIncome = paycheckAmount * paychecksPerMonth;
    } else {
      monthlyIncome = getExpectedMonthlyNet();
      if (monthlyIncome <= 0) return null;
    }

    const charityPercent = Math.max(mainAllocations.charity, MIN_CHARITY_PERCENT);
    const availablePercent = 100 - charityPercent;
    
    // Calculate needs for all categories
    const needs = {};
    let totalNeed = 0;
    
    // Fixed and Flexible needs (gap/12 + monthly spend)
    ['fixed', 'flexible'].forEach(key => {
      const account = accounts[key];
      const gap = Math.max(0, (account?.goal || 0) - (account?.balance || 0));
      const monthlyNeed = (gap / 12) + (account?.monthlySpend || 0);
      needs[key] = monthlyNeed;
      totalNeed += monthlyNeed;
    });

    // Savings needs (sum of all savings sub-goals)
    let totalSavingsNeed = 0;
    savingsCategoryOrder.forEach(key => {
      const account = accounts[key];
      const gap = Math.max(0, (account?.goal || 0) - (account?.balance || 0));
      const monthlyNeed = (gap / 12) + (account?.monthlySpend || 0);
      totalSavingsNeed += monthlyNeed;
    });
    needs.savings = totalSavingsNeed;
    totalNeed += totalSavingsNeed;

    const optimalMain = { charity: charityPercent };
    
    if (totalNeed > 0) {
      // Distribute available percent based on relative needs
      ['fixed', 'flexible', 'savings'].forEach(key => {
        const rawPercent = (needs[key] / totalNeed) * availablePercent;
        optimalMain[key] = roundToFive(Math.min(availablePercent, Math.max(0, rawPercent)));
      });
      
      // Ensure minimum for operating accounts if they have spending
      const minFixed = accounts.fixed?.monthlySpend > 0 ? 
        Math.ceil((accounts.fixed.monthlySpend / monthlyIncome) * 100 / 5) * 5 : 0;
      const minFlexible = accounts.flexible?.monthlySpend > 0 ? 
        Math.ceil((accounts.flexible.monthlySpend / monthlyIncome) * 100 / 5) * 5 : 0;
      
      if (optimalMain.fixed < minFixed) optimalMain.fixed = minFixed;
      if (optimalMain.flexible < minFlexible) optimalMain.flexible = minFlexible;
    } else {
      // No goals set, use balanced defaults
      optimalMain.fixed = roundToFive(availablePercent * 0.5);
      optimalMain.flexible = roundToFive(availablePercent * 0.2);
      optimalMain.savings = availablePercent - optimalMain.fixed - optimalMain.flexible;
    }

    // Normalize to available percent
    const nonCharitySum = optimalMain.fixed + optimalMain.flexible + optimalMain.savings;
    if (nonCharitySum !== availablePercent) {
      const diff = availablePercent - nonCharitySum;
      // Add difference to savings (prioritize savings if over, reduce if under)
      optimalMain.savings = Math.max(0, optimalMain.savings + diff);
    }

    return { 
      main: optimalMain, 
      totalNeedPercent: (totalNeed / monthlyIncome) * 100 
    };
  };

  const calculateOptimalSavingsAllocations = () => {
    const savingsNeeds = {};
    let totalSavingsNeed = 0;
    
    savingsCategoryOrder.forEach(key => {
      const account = accounts[key];
      const gap = Math.max(0, (account?.goal || 0) - (account?.balance || 0));
      const monthlyNeed = (gap / 12) + (account?.monthlySpend || 0);
      savingsNeeds[key] = monthlyNeed;
      totalSavingsNeed += monthlyNeed;
    });

    const optimalSavings = {};
    
    if (totalSavingsNeed > 0) {
      savingsCategoryOrder.forEach(key => {
        const rawPercent = (savingsNeeds[key] / totalSavingsNeed) * 100;
        optimalSavings[key] = roundToFive(Math.min(100, Math.max(0, rawPercent)));
      });
      
      const savingsSum = Object.values(optimalSavings).reduce((a, b) => a + b, 0);
      if (savingsSum !== 100 && savingsSum > 0) {
        const diff = 100 - savingsSum;
        const maxKey = savingsCategoryOrder.reduce((a, b) => 
          optimalSavings[a] > optimalSavings[b] ? a : b
        );
        optimalSavings[maxKey] += diff;
      }
    } else {
      savingsCategoryOrder.forEach(key => {
        optimalSavings[key] = 25;
      });
    }

    return optimalSavings;
  };

  const handleCalculate = () => {
    if (paycheck && parseFloat(paycheck) > 0) {
      setShowResults(true);
      setShowSuccess(false);
    }
  };

  const handleFreelanceCalculate = () => {
    if (freelancePaycheck && parseFloat(freelancePaycheck) > 0) {
      setFreelanceShowResults(true);
      setShowSuccess(false);
    }
  };

  const applyOptimalAllocations = () => {
    const optimal = calculateOptimalAllocations();
    if (optimal) {
      setMainAllocations(optimal.main);
    }
  };

  const applyOptimalSavingsAllocations = () => {
    const optimal = calculateOptimalSavingsAllocations();
    setSavingsAllocations(optimal);
  };

  const clearAllData = () => {
    setAccounts({
      fixed: { balance: 0, goal: 0, monthlySpend: 0 },
      flexible: { balance: 0, goal: 0, monthlySpend: 0 },
      charity: { balance: 0, goal: 0, monthlySpend: 0 },
      rainyDay: { balance: 0, goal: 0, monthlySpend: 0 },
      retirement: { balance: 0, goal: 0, monthlySpend: 0 },
      hsa: { balance: 0, goal: 0, monthlySpend: 0 },
      bigPurchases: { balance: 0, goal: 0, monthlySpend: 0 }
    });
    setRegularPaycheck('');
    setExpectedMonthlyBilling('');
    setShowClearConfirm(false);
  };

  const updateMonthlySpend = (key, value) => {
    setAccounts({
      ...accounts,
      [key]: { ...accounts[key], monthlySpend: parseFloat(value) || 0 }
    });
  };

  const results = showResults ? calculateAllocations(parseFloat(paycheck) || 0, deductTax) : null;
  const freelanceResults = freelanceShowResults ? calculateAllocations(parseFloat(freelancePaycheck) || 0, freelanceDeductTax) : null;
  const optimalAllocations = calculateOptimalAllocations();
  const optimalSavingsAllocations = calculateOptimalSavingsAllocations();
  const monthlyIncome = getMonthlyIncome();
  const totalMonthlySpend = getTotalMonthlySpend();
  const goalSummary = getGoalSummary();
  const runwayMonths = getRunwayMonths();
  const runwayWithRainyDay = getRunwayWithRainyDay();
  const forecastRunway = getForecastRunway();
  const activeGoals = getActiveGoals();
  const expectedMonthlyNet = getExpectedMonthlyNet();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-500">Loading your budget...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-lg mx-auto px-3 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Budget Calculator</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm mb-4">
          {['allocate', 'freelance', 'setup', 'percentages', 'goals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-1 rounded-lg font-medium transition-all text-[10px] ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Clear All Data?</h3>
              <p className="text-sm text-gray-600 mb-4">This will reset all your balances, goals, and monthly spending amounts.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  className="flex-1 py-2.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal - No auto timeout */}
        {showSuccess && lastAdded && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Paycheck Added!</h3>
              <p className="text-2xl font-bold text-emerald-600 mb-4">{formatCurrency(lastAdded.amount)}</p>
              
              <div className="text-left bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                <div className="font-medium text-gray-700 mb-2">Added to accounts:</div>
                {['fixed', 'flexible', 'charity'].map(key => (
                  lastAdded.results.main[key] > 0 && (
                    <div key={key} className="flex justify-between text-gray-600">
                      <span>{mainLabels[key]}</span>
                      <span className="text-emerald-600">+{formatCurrency(lastAdded.results.main[key])}</span>
                    </div>
                  )
                ))}
                {savingsCategoryOrder.map(key => (
                  lastAdded.results.savings[key] > 0 && (
                    <div key={key} className="flex justify-between text-gray-600">
                      <span>{savingsLabels[key]}</span>
                      <span className="text-emerald-600">+{formatCurrency(lastAdded.results.savings[key])}</span>
                    </div>
                  )
                ))}
              </div>
              
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-2.5 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Allocate Tab */}
        {activeTab === 'allocate' && (
          <div className="space-y-4">
            {/* Runway & Forecast Summary */}
            <div className="bg-slate-800 rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Runway</div>
                  <div className={`text-base font-bold ${runwayMonths && runwayMonths < 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {runwayMonths ? `${runwayMonths.toFixed(1)}` : '—'}
                  </div>
                  <div className="text-[9px] text-slate-500">months</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">+ Rainy Day</div>
                  <div className={`text-base font-bold ${runwayWithRainyDay && runwayWithRainyDay < 3 ? 'text-rose-400' : 'text-blue-400'}`}>
                    {runwayWithRainyDay ? `${runwayWithRainyDay.toFixed(1)}` : '—'}
                  </div>
                  <div className="text-[9px] text-slate-500">months</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Forecast</div>
                  <div className={`text-base font-bold ${
                    forecastRunway?.type === 'growing' ? 'text-emerald-400' : 
                    forecastRunway?.months && forecastRunway.months < 6 ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {forecastRunway ? (
                      forecastRunway.type === 'growing' && forecastRunway.months ? 
                        `${forecastRunway.months}` : 
                      forecastRunway.type === 'growing' ? '✓' :
                        `${forecastRunway.months?.toFixed(1)}`
                    ) : '—'}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {forecastRunway?.type === 'growing' ? 
                      (forecastRunway.months ? 'to 6mo buffer' : 'healthy') : 
                      'until depleted'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Budget</div>
                  <div className="text-base font-bold text-rose-400">{formatCurrency(totalMonthlySpend)}</div>
                  <div className="text-[9px] text-slate-500">per month</div>
                </div>
              </div>
              
              {/* Net Flow Indicator */}
              {forecastRunway && (
                <div className={`text-center py-1.5 rounded-lg text-xs ${
                  forecastRunway.type === 'growing' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-rose-900/50 text-rose-300'
                }`}>
                  {forecastRunway.type === 'growing' 
                    ? `+${formatCurrency(forecastRunway.netFlow)}/mo to operating` 
                    : `${formatCurrency(forecastRunway.netFlow)}/mo (depleting)`}
                </div>
              )}
              
              {/* Editable Monthly Spend */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Fixed Spend/mo</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      value={accounts.fixed?.monthlySpend || ''}
                      onChange={(e) => updateMonthlySpend('fixed', e.target.value)}
                      placeholder="0"
                      className="w-full pl-5 pr-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Flexible Spend/mo</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      value={accounts.flexible?.monthlySpend || ''}
                      onChange={(e) => updateMonthlySpend('flexible', e.target.value)}
                      placeholder="0"
                      className="w-full pl-5 pr-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Goals - Enhanced */}
            {activeGoals.length > 0 && (
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">Active Goals</span>
                  <span className="text-[10px] text-gray-400">{activeGoals.length} in progress</span>
                </div>
                <div className="space-y-3">
                  {activeGoals.map(goal => (
                    <div key={goal.key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">{goal.name}</span>
                        {goal.monthsInfo && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            goal.monthsInfo.months === Infinity 
                              ? 'bg-red-100 text-red-700' 
                              : goal.monthsInfo.months === 0 
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {goal.monthsInfo.message}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${goal.type === 'savings' ? 'bg-teal-500' : 'bg-emerald-500'}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>{formatCurrency(goal.balance)} saved</span>
                        <span>{formatCurrency(goal.remaining)} to go</span>
                        <span>Goal: {formatCurrency(goal.goal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Income Settings */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="space-y-3 mb-3 pb-3 border-b border-gray-100">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Typical Paycheck</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={regularPaycheck}
                      onChange={(e) => setRegularPaycheck(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Paychecks Per Month</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setPaychecksPerMonth(num)}
                        className={`flex-1 py-1.5 rounded-lg font-medium transition-all text-xs ${
                          paychecksPerMonth === num
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>
                {monthlyIncome > 0 && (
                  <div className="text-center text-xs text-gray-500">
                    Monthly Income: <span className="font-semibold text-emerald-600">{formatCurrency(monthlyIncome)}</span>
                  </div>
                )}
              </div>

              {/* Paycheck Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  This Paycheck
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      value={paycheck}
                      onChange={(e) => {
                        setPaycheck(e.target.value);
                        setShowResults(false);
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-3 text-xl font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCalculate}
                    disabled={!paycheck || parseFloat(paycheck) <= 0}
                    className="px-6 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Go
                  </button>
                </div>
                
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductTax}
                    onChange={(e) => {
                      setDeductTax(e.target.checked);
                      setShowResults(false);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-600">
                    Deduct 33% for taxes (1099 income)
                  </span>
                </label>
              </div>
            </div>

            {showResults && results && (
              <>
                {deductTax && results.taxWithheld > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-amber-800">Tax Withheld (33%)</span>
                      <span className="text-sm font-bold text-amber-700">{formatCurrency(results.taxWithheld)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-amber-600">Net to Allocate</span>
                      <span className="text-sm font-semibold text-amber-700">{formatCurrency(results.netAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {mainCategoryOrder.map(key => (
                    <div key={key} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">{mainLabels[key]}</span>
                        <span className="text-xs text-gray-400">{mainAllocations[key]}%</span>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        {formatCurrency(results.main[key] || 0)}
                      </div>
                    </div>
                  ))}
                </div>

                {results.main.savings > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Savings Breakdown</span>
                      <span className="text-xs text-gray-500">{formatCurrency(results.main.savings)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {savingsCategoryOrder.map(key => (
                        <div key={key} className="bg-white/60 rounded-lg p-2.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-medium text-gray-600">{savingsLabels[key]}</span>
                            <span className="text-[10px] text-gray-400">{savingsAllocations[key]}%</span>
                          </div>
                          <div className="text-base font-bold text-teal-600">
                            {formatCurrency(results.savings[key] || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-slate-300">Allocated</span>
                    <span className="text-xl font-bold text-white">
                      {formatCurrencyFull(results.netAmount)}
                    </span>
                  </div>
                  <button
                    onClick={handleRegularAddToBalances}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add to Balances
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Freelance Tab */}
        {activeTab === 'freelance' && (
          <div className="space-y-4">
            {/* Expected Billing */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-purple-100">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Expected Billing</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Monthly Billing Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={expectedMonthlyBilling}
                      onChange={(e) => setExpectedMonthlyBilling(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Expected Duration</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 6, 12].map(num => (
                      <button
                        key={num}
                        onClick={() => setExpectedBillingMonths(num)}
                        className={`flex-1 py-1.5 rounded-lg font-medium transition-all text-xs ${
                          expectedBillingMonths === num
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}mo
                      </button>
                    ))}
                  </div>
                </div>
                {expectedMonthlyNet > 0 && (
                  <div className="bg-white/60 rounded-lg p-3 mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Gross Monthly</span>
                      <span className="text-gray-800">{formatCurrency(parseFloat(expectedMonthlyBilling) || 0)}</span>
                    </div>
                    {freelanceDeductTax && (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Tax (33%)</span>
                        <span className="text-amber-600">-{formatCurrency((parseFloat(expectedMonthlyBilling) || 0) * TAX_RATE)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-semibold pt-1 border-t border-gray-200">
                      <span className="text-gray-700">Net Monthly</span>
                      <span className="text-purple-600">{formatCurrency(expectedMonthlyNet)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Total Expected ({expectedBillingMonths}mo)</span>
                      <span className="text-purple-600 font-semibold">{formatCurrency(expectedMonthlyNet * expectedBillingMonths)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Received */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Payment Received</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount Received
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      value={freelancePaycheck}
                      onChange={(e) => {
                        setFreelancePaycheck(e.target.value);
                        setFreelanceShowResults(false);
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-3 text-xl font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleFreelanceCalculate}
                    disabled={!freelancePaycheck || parseFloat(freelancePaycheck) <= 0}
                    className="px-6 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Go
                  </button>
                </div>
                
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freelanceDeductTax}
                    onChange={(e) => {
                      setFreelanceDeductTax(e.target.checked);
                      setFreelanceShowResults(false);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-600">
                    Deduct 33% for taxes
                  </span>
                </label>
              </div>
            </div>

            {freelanceShowResults && freelanceResults && (
              <>
                {freelanceDeductTax && freelanceResults.taxWithheld > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-amber-800">Tax Withheld (33%)</span>
                      <span className="text-sm font-bold text-amber-700">{formatCurrency(freelanceResults.taxWithheld)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-amber-600">Net to Allocate</span>
                      <span className="text-sm font-semibold text-amber-700">{formatCurrency(freelanceResults.netAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {mainCategoryOrder.map(key => (
                    <div key={key} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">{mainLabels[key]}</span>
                        <span className="text-xs text-gray-400">{mainAllocations[key]}%</span>
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(freelanceResults.main[key] || 0)}
                      </div>
                    </div>
                  ))}
                </div>

                {freelanceResults.main.savings > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Savings Breakdown</span>
                      <span className="text-xs text-gray-500">{formatCurrency(freelanceResults.main.savings)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {savingsCategoryOrder.map(key => (
                        <div key={key} className="bg-white/60 rounded-lg p-2.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-medium text-gray-600">{savingsLabels[key]}</span>
                            <span className="text-[10px] text-gray-400">{savingsAllocations[key]}%</span>
                          </div>
                          <div className="text-base font-bold text-indigo-600">
                            {formatCurrency(freelanceResults.savings[key] || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-purple-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-purple-200">Allocated</span>
                    <span className="text-xl font-bold text-white">
                      {formatCurrencyFull(freelanceResults.netAmount)}
                    </span>
                  </div>
                  <button
                    onClick={handleFreelanceAddToBalances}
                    className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add to Balances
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Setup Tab */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Current Account Balances</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Fixed Account Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={accounts.fixed?.balance || ''}
                      onChange={(e) => setAccounts({
                        ...accounts,
                        fixed: { ...accounts.fixed, balance: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Flexible Account Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={accounts.flexible?.balance || ''}
                      onChange={(e) => setAccounts({
                        ...accounts,
                        flexible: { ...accounts.flexible, balance: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Operating Balance</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(getTotalBalance())}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Monthly Budget (Spending)</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Fixed Monthly Spend</label>
                  <p className="text-[10px] text-gray-400 mb-1">Rent, bills, subscriptions, insurance, etc.</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={accounts.fixed?.monthlySpend || ''}
                      onChange={(e) => setAccounts({
                        ...accounts,
                        fixed: { ...accounts.fixed, monthlySpend: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Flexible Monthly Spend</label>
                  <p className="text-[10px] text-gray-400 mb-1">Groceries, dining, shopping, entertainment, etc.</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={accounts.flexible?.monthlySpend || ''}
                      onChange={(e) => setAccounts({
                        ...accounts,
                        flexible: { ...accounts.flexible, monthlySpend: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Monthly Budget</span>
                  <span className="text-sm font-bold text-rose-500">{formatCurrency(totalMonthlySpend)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 shadow-sm border border-emerald-100">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Savings Account Balances</h2>
              
              <div className="space-y-3">
                {savingsCategoryOrder.map(key => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{savingsLabelsFull[key]}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={accounts[key]?.balance || ''}
                        onChange={(e) => setAccounts({
                          ...accounts,
                          [key]: { ...accounts[key], balance: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2 text-red-500 font-medium hover:text-red-700 transition-colors text-sm"
            >
              Clear All Data
            </button>
          </div>
        )}

        {/* Percentages Tab */}
        {activeTab === 'percentages' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Main Categories</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  mainTotal === 100 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {mainTotal}%
                </span>
              </div>
              
              <div className="space-y-3">
                {mainCategoryOrder.map(key => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-gray-600">{mainLabelsFull[key]}</label>
                      <span className="text-xs text-gray-500 tabular-nums">{mainAllocations[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={mainAllocations[key]}
                      onChange={(e) => setMainAllocations({
                        ...mainAllocations,
                        [key]: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                ))}
              </div>

              {mainTotal !== 100 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    {mainTotal < 100 ? `${100 - mainTotal}% unallocated` : `${mainTotal - 100}% over`}
                  </p>
                </div>
              )}
            </div>

            {optimalAllocations && (
              <div className="bg-slate-800 rounded-xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-white mb-1">Optimize Main Categories</h2>
                <p className="text-xs text-slate-400 mb-3">
                  Based on goals & spending (charity min {MIN_CHARITY_PERCENT}%)
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-slate-700 rounded-lg p-2">
                    <div className="text-slate-400 mb-1">Current</div>
                    {mainCategoryOrder.map(key => (
                      <div key={key} className="flex justify-between text-white">
                        <span>{mainLabels[key]}</span>
                        <span>{mainAllocations[key]}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-600 rounded-lg p-2">
                    <div className="text-emerald-200 mb-1">Suggested</div>
                    {mainCategoryOrder.map(key => (
                      <div key={key} className="flex justify-between text-white">
                        <span>{mainLabels[key]}</span>
                        <span>{optimalAllocations.main[key]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={applyOptimalAllocations}
                  className="w-full bg-emerald-500 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-400 transition-colors text-sm"
                >
                  Apply Main Optimization
                </button>
              </div>
            )}

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 shadow-sm border border-emerald-100">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-sm font-semibold text-gray-800">Savings Breakdown</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  savingsTotal === 100 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {savingsTotal}%
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mb-3">
                Split your {mainAllocations.savings}% savings
              </p>

              <div className="space-y-3">
                {savingsCategoryOrder.map(key => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-gray-600">{savingsLabelsFull[key]}</label>
                      <span className="text-xs text-gray-500 tabular-nums">{savingsAllocations[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={savingsAllocations[key]}
                      onChange={(e) => setSavingsAllocations({
                        ...savingsAllocations,
                        [key]: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>
                ))}
              </div>

              {savingsTotal !== 100 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    {savingsTotal < 100 ? `${100 - savingsTotal}% unallocated` : `${savingsTotal - 100}% over`}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-teal-700 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-white mb-1">Optimize Savings Breakdown</h2>
              <p className="text-xs text-teal-200 mb-3">
                Based on your savings goals and balances
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-teal-800 rounded-lg p-2">
                  <div className="text-teal-300 mb-1">Current</div>
                  {savingsCategoryOrder.map(key => (
                    <div key={key} className="flex justify-between text-white">
                      <span>{savingsLabels[key]}</span>
                      <span>{savingsAllocations[key]}%</span>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-500 rounded-lg p-2">
                  <div className="text-emerald-100 mb-1">Suggested</div>
                  {savingsCategoryOrder.map(key => (
                    <div key={key} className="flex justify-between text-white">
                      <span>{savingsLabels[key]}</span>
                      <span>{optimalSavingsAllocations[key]}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={applyOptimalSavingsAllocations}
                className="w-full bg-emerald-400 text-teal-900 py-2.5 rounded-lg font-medium hover:bg-emerald-300 transition-colors text-sm"
              >
                Apply Savings Optimization
              </button>
            </div>

            <button
              onClick={() => {
                setMainAllocations({ fixed: 50, savings: 25, flexible: 15, charity: 10 });
                setSavingsAllocations({ rainyDay: 40, retirement: 30, hsa: 15, bigPurchases: 15 });
              }}
              className="w-full py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors text-sm"
            >
              Reset to Defaults
            </button>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {goalSummary.totalGoal > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">Overall Progress</span>
                  <span className="text-xs text-gray-500">{Math.round(goalSummary.progress)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.min(100, goalSummary.progress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Saved: {formatCurrency(goalSummary.totalBalance)}</span>
                  <span>Goal: {formatCurrency(goalSummary.totalGoal)}</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Account Goals</h2>
              
              <div className="space-y-4">
                {['fixed', 'flexible'].map(key => {
                  const monthsInfo = calculateMonthsToGoal(key);
                  return (
                    <div key={key} className="space-y-2 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-medium text-gray-700">{mainLabelsFull[key]}</h3>
                        {monthsInfo && accounts[key].goal > 0 && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            monthsInfo.months === Infinity 
                              ? 'bg-red-100 text-red-700' 
                              : monthsInfo.months === 0 
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {monthsInfo.message}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Goal Amount</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            value={accounts[key]?.goal || ''}
                            onChange={(e) => setAccounts({
                              ...accounts,
                              [key]: { ...accounts[key], goal: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0"
                            className="w-full pl-5 pr-1 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      {accounts[key]?.goal > 0 && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, ((accounts[key]?.balance || 0) / accounts[key].goal) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>{formatCurrency(accounts[key]?.balance || 0)} saved</span>
                            <span>{formatCurrency(accounts[key].goal - (accounts[key]?.balance || 0))} to go</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 shadow-sm border border-emerald-100">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Savings Goals</h2>
              
              <div className="space-y-4">
                {savingsCategoryOrder.map(key => {
                  const monthsInfo = calculateMonthsToGoal(key, true);
                  return (
                    <div key={key} className="space-y-2 pb-3 border-b border-emerald-200 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-medium text-gray-700">{savingsLabelsFull[key]}</h3>
                        {monthsInfo && accounts[key]?.goal > 0 && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            monthsInfo.months === Infinity 
                              ? 'bg-red-100 text-red-700' 
                              : monthsInfo.months === 0 
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {monthsInfo.message}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-0.5">Goal Amount</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            value={accounts[key]?.goal || ''}
                            onChange={(e) => setAccounts({
                              ...accounts,
                              [key]: { ...accounts[key], goal: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0"
                            className="w-full pl-5 pr-1 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          />
                        </div>
                      </div>
                      {accounts[key]?.goal > 0 && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(100, ((accounts[key]?.balance || 0) / accounts[key].goal) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>{formatCurrency(accounts[key]?.balance || 0)} saved</span>
                            <span>{formatCurrency(accounts[key].goal - (accounts[key]?.balance || 0))} to go</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCalculator;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(BudgetCalculator));
