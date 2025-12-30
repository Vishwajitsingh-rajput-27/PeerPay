import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LogOut, 
  User, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'peerpay-demo';

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
  </div>
);

const AuthScreen = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register Flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Auth Profile
        await updateProfile(user, { displayName: name });

        // Create User Wallet in Firestore (Public for discovery in this P2P demo)
        // Note: In a real app, strict rules would separate public profile from private wallet
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
          uid: user.uid,
          email: user.email.toLowerCase(),
          displayName: name,
          balance: 1000.00, // Sign up bonus
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wallet className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          PeerPay
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? 'Sign in to your wallet' : 'Create a new account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? 'Sign in' : 'Create Account')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? 'New to PeerPay?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              >
                {isLogin ? 'Register now' : 'Sign in instead'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SendMoneyModal = ({ user, userData, onClose }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('idle'); // idle, searching, verifying, processing, success, error
  const [message, setMessage] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setMessage("Please enter a valid amount");
      setStatus('error');
      return;
    }
    if (parseFloat(amount) > userData.balance) {
      setMessage("Insufficient funds");
      setStatus('error');
      return;
    }
    if (recipientEmail.toLowerCase() === user.email.toLowerCase()) {
      setMessage("You cannot send money to yourself");
      setStatus('error');
      return;
    }

    setStatus('processing');
    setMessage('Processing transaction...');

    try {
      // 1. Find Recipient
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
      // Note: In production, query by indexed email field. 
      // Rule 2 compliant: simple where clause.
      const q = query(usersRef, where("email", "==", recipientEmail.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Recipient not found");
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientData = recipientDoc.data();

      // 2. Perform Atomic Transaction
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        const receiverRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', recipientData.uid);
        
        // Read fresh data inside transaction
        const senderSnap = await transaction.get(senderRef);
        if (!senderSnap.exists()) throw new Error("Sender account error");
        
        const newSenderBalance = senderSnap.data().balance - parseFloat(amount);
        if (newSenderBalance < 0) throw new Error("Insufficient funds");

        const receiverSnap = await transaction.get(receiverRef);
        if (!receiverSnap.exists()) throw new Error("Receiver account error");
        
        const newReceiverBalance = receiverSnap.data().balance + parseFloat(amount);

        // Writes
        transaction.update(senderRef, { balance: newSenderBalance });
        transaction.update(receiverRef, { balance: newReceiverBalance });

        // Create Transaction Record
        const transactionRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));
        transaction.set(transactionRef, {
          fromUid: user.uid,
          fromName: userData.displayName,
          toUid: recipientData.uid,
          toName: recipientData.displayName,
          amount: parseFloat(amount),
          timestamp: serverTimestamp(),
          type: 'transfer'
        });
      });

      setStatus('success');
      setMessage(`Successfully sent $${amount} to ${recipientData.displayName}`);
      setTimeout(onClose, 2000);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Send Money</h3>
        
        {status === 'success' ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Transfer Complete!</p>
            <p className="text-gray-500">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="friend@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">USD</span>
                </div>
              </div>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                <span className="text-sm text-red-800">{message}</span>
              </div>
            )}

            {status === 'processing' && (
               <div className="bg-blue-50 p-3 rounded-md flex items-center">
               <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
               <span className="text-sm text-blue-800">Processing secure transfer...</span>
             </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={status === 'processing'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'processing'}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                Send Funds
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);

  // Fetch User Data Realtime
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), 
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      }, 
      (error) => console.error("Error fetching user data:", error)
    );
    return () => unsub();
  }, [user]);

  // Fetch Transactions (Incoming & Outgoing merged)
  // Rule 2: Separate simple queries, merge in memory.
  useEffect(() => {
    if (!user) return;

    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    
    // Query 1: Outgoing
    const q1 = query(txRef, where('fromUid', '==', user.uid));
    // Query 2: Incoming
    const q2 = query(txRef, where('toUid', '==', user.uid));

    const unsub1 = onSnapshot(q1, (snap1) => {
      const outgoing = snap1.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Since we can't easily wait for both in a single snapshot stream, 
      // we'll trigger a fetch for incoming whenever outgoing changes, or vice versa?
      // Better approach for React: use state for each list and merge in render or useMemo.
      // But for simplicity in this effect, I'll just set a state that triggers a re-merge?
      // Actually, let's just listen to both and update separate states.
    });

    // Let's refactor to separate states to avoid race conditions/flickering
    return () => unsub1();
  }, [user]);

  // Better Transaction Fetching Strategy for this environment
  useEffect(() => {
    if (!user) return;
    
    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    
    const unsubOutgoing = onSnapshot(query(txRef, where('fromUid', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id, direction: 'out' }));
      setTransactions(prev => {
        // Filter out old outgoing, add new
        const others = prev.filter(t => t.direction === 'in');
        return [...others, ...data].sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      });
    }, (err) => console.error(err));

    const unsubIncoming = onSnapshot(query(txRef, where('toUid', '==', user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id, direction: 'in' }));
      setTransactions(prev => {
        // Filter out old incoming, add new
        const others = prev.filter(t => t.direction === 'out');
        return [...others, ...data].sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      });
    }, (err) => console.error(err));

    return () => {
      unsubOutgoing();
      unsubIncoming();
    };
  }, [user]);


  if (!userData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">PeerPay</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-gray-900">{userData.displayName}</span>
                <span className="text-xs text-gray-500">{userData.email}</span>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Sign Out"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Balance & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>
              
              <h2 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Total Balance</h2>
              <div className="mt-2 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight">
                  ${userData.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="ml-2 text-indigo-200">USD</span>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={() => setShowSendModal(true)}
                  className="w-full bg-white text-indigo-600 py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-indigo-50 transition transform active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Money
                </button>
              </div>
            </div>

            {/* Quick Stats or Promo (Optional) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Account Status</h3>
               <div className="flex items-center justify-between py-2 border-b border-gray-100">
                 <span className="text-sm text-gray-600">Account Type</span>
                 <span className="text-sm font-medium text-gray-900">Personal</span>
               </div>
               <div className="flex items-center justify-between py-2 border-b border-gray-100">
                 <span className="text-sm text-gray-600">Member Since</span>
                 <span className="text-sm font-medium text-gray-900">
                    {userData.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                 </span>
               </div>
               <div className="flex items-center justify-between py-2">
                 <span className="text-sm text-gray-600">Status</span>
                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                   Active
                 </span>
               </div>
            </div>
          </div>

          {/* Right Column: Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <History className="w-5 h-5 mr-2 text-gray-400" />
                  Recent Transactions
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p>No transactions yet.</p>
                    <p className="text-sm mt-2">Send money to start your history!</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                      <li key={tx.id} className="p-6 hover:bg-gray-50 transition flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.direction === 'in' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {tx.direction === 'in' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {tx.direction === 'in' ? `Received from ${tx.fromName}` : `Sent to ${tx.toName}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tx.timestamp?.toDate().toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${
                          tx.direction === 'in' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {tx.direction === 'in' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {showSendModal && (
        <SendMoneyModal 
          user={user} 
          userData={userData} 
          onClose={() => setShowSendModal(false)} 
        />
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Use custom token if provided (e.g., from an environment where auth is pre-handled)
      // Otherwise fallback to anonymous (though for this specific app, we really want email/pass for P2P identity)
      // We will prefer the user to manually log in if no token is present, 
      // rather than auto-signing in anonymously, because anonymous users can't easily do P2P discovery by email.
      
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Token auth failed", e);
        }
      } 
      // We intentionally do NOT sign in anonymously automatically here to allow the User to use the Registration form
      // so they have a real email identity for P2P sending.
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;

  return (
    <>
      {user ? <Dashboard user={user} /> : <AuthScreen setUser={setUser} />}
    </>
  );
}
