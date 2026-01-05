import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Trophy, Flame, CheckCircle2, Zap, X, 
  Sun, Moon, LayoutGrid, Infinity as InfinityIcon, 
  Smile, Frown, Meh, Heart, Star, MessageSquare,
  ShoppingBag, Settings, Lock, Gift, Coins, User, History, Receipt, RefreshCw,
  Camera, Edit3, Upload, Palette, Image as ImageIcon, LogOut, RotateCcw, Ticket,
  LogIn, UserPlus, Key, Copy, Check, UserMinus, Users, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- 预设数据 ---
const MOODS = [
  { id: 'happy', icon: <Smile size={24} />, color: 'text-green-500', bg: 'bg-green-500', label: '开心' },
  { id: 'neutral', icon: <Meh size={24} />, color: 'text-yellow-500', bg: 'bg-yellow-500', label: '平淡' },
  { id: 'sad', icon: <Frown size={24} />, color: 'text-blue-500', bg: 'bg-blue-500', label: '低落' },
];

const THEMES = [
  { id: 0, bg: 'from-orange-400 to-rose-400', border: 'border-orange-200', dot: 'bg-orange-400' },
  { id: 1, bg: 'from-blue-400 to-cyan-300', border: 'border-blue-200', dot: 'bg-blue-400' },
  { id: 2, bg: 'from-emerald-400 to-green-300', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  { id: 3, bg: 'from-purple-500 to-indigo-400', border: 'border-purple-200', dot: 'bg-purple-500' },
  { id: 4, bg: 'from-pink-500 to-rose-500', border: 'border-pink-200', dot: 'bg-pink-500' },
  { id: 5, bg: 'from-indigo-500 to-blue-500', border: 'border-indigo-200', dot: 'bg-indigo-500' },
];

const AVATAR_PRESETS = ['🤠', '🐱', '🦊', '🦄', '🐸', '🤖', '👽', '👻', '🦸', '🧚', '🐼', '🐯'];

export default function App() {
  const [isDark, setIsDark] = useState(true);
  
  // --- 身份验证状态 ---
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spark-user-session'));
    } catch { return null; }
  });

  const [localGuestId] = useState(() => {
    try {
      let uid = localStorage.getItem('spark-user-id');
      if (!uid) {
        uid = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('spark-user-id', uid);
      }
      return uid;
    } catch (e) {
      return 'user_guest';
    }
  });
  
  const userId = loggedInUser ? loggedInUser.id : localGuestId;
  
  const [nickname, setNickname] = useState(() => loggedInUser ? loggedInUser.nickname : (localStorage.getItem('spark-nickname') || '神秘打卡人'));
  const [avatar, setAvatar] = useState(() => loggedInUser ? loggedInUser.avatar : (localStorage.getItem('spark-avatar') || '🤠'));
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('spark-bg-image') || '');

  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('spark-points') || '0'));
  const [lastPointDate, setLastPointDate] = useState(() => localStorage.getItem('spark-last-point-date') || '');

  const [habits, setHabits] = useState(() => {
    try { 
      const stored = JSON.parse(localStorage.getItem('spark-habits') || '[]');
      const today = new Date().toLocaleDateString();
      return stored.map(h => {
        if (h.lastCompletedDate !== today) {
           return { ...h, completedToday: false };
        }
        return h;
      });
    } catch { return []; }
  });

  const [storeItems, setStoreItems] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]); 
  const [adminUsers, setAdminUsers] = useState([]); 
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(null); 
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Auth Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Auth Form State
  const [authForm, setAuthForm] = useState({ username: '', password: '', nickname: '', inviteCode: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState("");

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [toast, setToast] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false); 

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState('streak'); 
  const [targetDays, setTargetDays] = useState(21); 
  const [checkInMood, setCheckInMood] = useState('happy');
  const [checkInComment, setCheckInComment] = useState('');

  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [adminItemName, setAdminItemName] = useState('');
  const [adminItemCost, setAdminItemCost] = useState(100);
  const [adminItemIcon, setAdminItemIcon] = useState('🎁');

  const myCardsCount = React.useMemo(() => {
    if (!transactions) return 0;
    const bought = transactions.filter(t => t.user_id === userId && t.item_name === '补签卡').length;
    const used = transactions.filter(t => t.user_id === userId && t.item_name === 'used_card').length;
    return Math.max(0, bought - used);
  }, [transactions, userId]);

  useEffect(() => {
    if (loggedInUser) {
      setNickname(loggedInUser.nickname);
      setAvatar(loggedInUser.avatar);
      localStorage.setItem('spark-user-session', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('spark-user-session');
    }
  }, [loggedInUser]);

  // --- 核心：定期检查用户状态 ---
  useEffect(() => {
    if (!loggedInUser) return;

    const checkUserStatus = async () => {
      try {
        // 请求后端检查用户是否存在
        const res = await fetch(`/api/auth/check?id=${loggedInUser.id}`);
        if (res.ok) {
          const data = await res.json();
          // 如果用户无效 (被删除)，则强制退出
          if (!data.valid) {
            setLoggedInUser(null);
            setShowStoreModal(false); // 如果正在商店，关闭它
            setShowProfileModal(false);
            showToast("您的账号已被管理员注销 🚫");
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      }
    };

    // 立即检查一次
    checkUserStatus();

    // 每 5 秒轮询一次，确保被删除后能较快反应
    const intervalId = setInterval(checkUserStatus, 5000);
    return () => clearInterval(intervalId);
  }, [loggedInUser]);

  useEffect(() => {
    try {
      localStorage.setItem('spark-habits', JSON.stringify(habits));
      localStorage.setItem('spark-points', points.toString());
      localStorage.setItem('spark-nickname', nickname);
      localStorage.setItem('spark-avatar', avatar);
      localStorage.setItem('spark-last-point-date', lastPointDate);
      localStorage.setItem('spark-bg-image', bgImage); 
    } catch (e) {
      console.warn("Storage warning", e);
    }
  }, [habits, points, nickname, avatar, lastPointDate, bgImage]);

  const fetchCloudData = async () => {
    setIsLoadingCloud(true);
    try {
      const storeRes = await fetch('/api/store', { cache: 'no-store' });
      if (storeRes.ok) setStoreItems(await storeRes.json());
      
      const transRes = await fetch('/api/transact', { cache: 'no-store' });
      if (transRes.ok) setTransactions(await transRes.json());
      
      if (isAdmin) {
        const codesRes = await fetch('/api/codes', { cache: 'no-store' });
        if (codesRes.ok) setInviteCodes(await codesRes.json());
        
        const usersRes = await fetch('/api/admin/users', { cache: 'no-store' });
        if (usersRes.ok) setAdminUsers(await usersRes.json());
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (showStoreModal || showAdminPanel) {
      fetchCloudData();
    }
  }, [showStoreModal, showAdminPanel]);

  const sortedHabits = [...habits].sort((a, b) => {
    if (a.type === 'streak' && b.type !== 'streak') return -1;
    if (a.type !== 'streak' && b.type === 'streak') return 1;
    if (a.type === 'grid' && b.type === 'grid') {
      return a.targetDays - b.targetDays;
    }
    return 0;
  });

  // --- Auth Handlers ---

  const handleRegister = async () => {
    if (!authForm.username || !authForm.password || !authForm.inviteCode) {
       showToast("请填写完整信息及验证码");
       return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedInUser(data.user);
        setShowRegisterModal(false);
        showToast("注册成功，欢迎加入！🎉");
        setAuthForm({ username: '', password: '', nickname: '', inviteCode: '', newPassword: '' });
      } else {
        showToast(data.error || "注册失败");
      }
    } catch (e) {
      showToast("网络错误");
    }
  };

  const handleLogin = async () => {
     if (!authForm.username || !authForm.password) {
       showToast("请输入账号密码");
       return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedInUser(data.user);
        setShowLoginModal(false);
        showToast("登录成功！👋");
        setAuthForm({ username: '', password: '', nickname: '', inviteCode: '', newPassword: '' });
      } else {
        showToast(data.error || "用户名或密码错误 🚫");
      }
    } catch (e) {
      showToast("网络错误");
    }
  };
  
  const handleResetPassword = async () => {
    if (!authForm.username || !authForm.inviteCode || !authForm.newPassword) {
      showToast("请填写所有信息");
      return;
    }
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          username: authForm.username, 
          inviteCode: authForm.inviteCode, 
          newPassword: authForm.newPassword 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowForgotModal(false);
        showToast("密码重置成功，请重新登录 ✨");
        setAuthForm({ username: '', password: '', nickname: '', inviteCode: '', newPassword: '' });
      } else {
        showToast(data.error || "验证失败");
      }
    } catch (e) {
      showToast("网络错误");
    }
  };

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      setLoggedInUser(null);
      setShowProfileModal(false);
      showToast("已退出登录");
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      showToast("请输入密码以确认");
      return;
    }
    try {
      const res = await fetch('/api/auth/delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: loggedInUser.id, password: deletePassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedInUser(null);
        setShowDeleteAccountModal(false);
        setShowProfileModal(false);
        setDeletePassword("");
        showToast("账号已注销，邀请码已失效 👋");
      } else {
        showToast(data.error || "注销失败");
      }
    } catch(e) { 
      showToast("网络错误"); 
    }
  };

  const adminDeleteUser = async (targetUserId) => {
    if (window.confirm("危险操作：确定要删除该用户吗？该操作不可恢复，且会删除关联的邀请码。")) {
       try {
         const res = await fetch(`/api/admin/users?id=${targetUserId}`, { method: 'DELETE' });
         if (res.ok) {
           showToast("用户已删除");
           fetchCloudData(); 
         } else {
           showToast("删除失败");
         }
       } catch (e) {
         showToast("网络错误");
       }
    }
  };

  const generateInviteCode = async () => {
     try {
       const res = await fetch('/api/codes', { method: 'POST' });
       if (res.ok) {
         fetchCloudData();
         showToast("验证码已生成！");
       }
     } catch (e) { showToast("生成失败"); }
  };
  
  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("已复制到剪贴板 📋");
    }
  };

  // --- 新增：处理打开商店逻辑 ---
  const handleOpenStore = () => {
    if (!loggedInUser) {
      showToast("请先登录才能使用商店功能 🔒");
      setShowLoginModal(true);
      return;
    }
    setShowStoreModal(true);
  };

  // --- Existing Logic ---

  const tryAddDailyPoint = () => {
    const today = new Date().toLocaleDateString();
    if (lastPointDate !== today) {
      setPoints(p => p + 1);
      setLastPointDate(today);
      return true;
    }
    return false;
  };

  const createHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now(),
      name: newHabitName,
      theme: Math.floor(Math.random() * THEMES.length),
      type: newHabitType, 
      streak: 0, 
      completedToday: false, 
      lastCompletedDate: '',
      targetDays: newHabitType === 'grid' ? targetDays : 0, 
      logs: [], 
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddModal(false);
    showToast('新挑战已开启！🚀');
  };

  const requestDeleteHabit = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteHabit = () => {
    if (deleteConfirmId) {
      setHabits(habits.filter(h => h.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast('目标已删除 👋');
    }
  };

  const toggleStreakHabit = (id) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        if (h.completedToday) {
          showToast('落子无悔，打卡后不能取消哦！🚫');
          return h; 
        }
        triggerConfetti();
        const earned = tryAddDailyPoint();
        showToast(earned ? '打卡成功！积分 +1' : '打卡成功！今日积分已拿 ✨');
        const today = new Date().toLocaleDateString();
        return { 
          ...h, 
          completedToday: true, 
          streak: h.streak + 1,
          lastCompletedDate: today 
        };
      }
      return h;
    }));
  };

  const useRetroactiveCard = async (habitId) => {
    if (myCardsCount <= 0) {
      showToast('补签卡不足，请去商店兑换！');
      return;
    }

    if (window.confirm('确定使用一张补签卡进行补签吗？🎫')) {
      try {
        await fetch('/api/transact', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId, userName: nickname, userAvatar: avatar, 
            itemName: 'used_card', itemIcon: '🎫', cost: 0, 
            date: new Date().toLocaleString()
          })
        });
        fetchCloudData(); 
      } catch(e) { console.error("API Error"); }

      setHabits(habits.map(h => {
        if (h.id === habitId) {
          const newLog = { 
            date: `补签 ${new Date().toLocaleDateString()}`, 
            timestamp: Date.now(), 
            mood: 'neutral', 
            comment: '使用补签卡' 
          };
          if (h.type === 'streak') {
             return { ...h, streak: h.streak + 1 };
          } else {
             return { ...h, logs: [...h.logs, newLog] };
          }
        }
        return h;
      }));

      showToast('补签成功！✨');
      triggerConfetti();
    }
  };

  const openGridCheckIn = (id) => {
    const habit = habits.find(h => h.id === id);
    const today = new Date().toLocaleDateString();
    if (habit.logs.some(log => log.date.includes(today))) {
      showToast('今天已经记录过心情啦 ✨');
      return;
    }
    setShowCheckInModal(id);
    setCheckInMood('happy');
    setCheckInComment('');
  };

  const submitGridCheckIn = () => {
    if (!showCheckInModal) return;
    setHabits(habits.map(h => {
      if (h.id === showCheckInModal) {
        const newLog = { 
          date: new Date().toLocaleString(), 
          timestamp: Date.now(), 
          mood: checkInMood, 
          comment: checkInComment 
        };
        return { ...h, logs: [...h.logs, newLog] };
      }
      return h;
    }));
    triggerConfetti();
    const earned = tryAddDailyPoint();
    showToast(earned ? '记录成功！积分 +1' : '记录成功！今日积分已拿 ✨');
    setShowCheckInModal(null);
  };

  const buyItem = async (item) => {
    if (points >= item.cost) {
      if (window.confirm(`确认消耗 ${item.cost} 积分兑换 ${item.name} 吗？`)) {
        setPoints(p => p - item.cost);
        try {
          await fetch('/api/transact', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              userId, userName: nickname, userAvatar: avatar, 
              itemName: item.name, itemIcon: item.icon, cost: item.cost, 
              date: new Date().toLocaleString()
            })
          });
          fetchCloudData();
        } catch(e) { console.error("API Error"); }
        showToast(`兑换成功！管理员已收到您的请求 🎉`);
        triggerConfetti();
      }
    } else {
      showToast('积分不足，快去打卡赚积分吧！🥺');
    }
  };

  const openProfileModal = () => {
    setEditName(nickname);
    setEditAvatar(avatar);
    setShowProfileModal(true);
  }

  const saveProfile = () => {
    if (editName.trim()) setNickname(editName);
    setAvatar(editAvatar);
    setShowProfileModal(false);
    showToast('个人资料已更新 ✨');
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('图片太大啦，请选择 2MB 以内的图片 🖼️');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('壁纸太大啦，请选择 3MB 以内的图片 🖼️');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          setBgImage(reader.result);
          showToast('自定义壁纸设置成功！✨');
        } catch(e) {
          showToast('设置失败，图片可能过大');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminLogin = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setShowAdminPanel(true);
        showToast("验证成功！🔐");
      } else {
        showToast("密码错误 🚫");
        setPasswordInput("");
      }
    } catch (e) {
       showToast("无法连接服务器");
    } finally {
      setIsVerifying(false);
    }
  };

  const addStoreItem = async () => {
    if (!adminItemName) return;
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: adminItemName, cost: adminItemCost, icon: adminItemIcon, desc: '管理员添加' })
      });
      if (!res.ok) throw new Error("API Failed");
      setAdminItemName('');
      fetchCloudData();
      showToast('商品已上架，全网同步！');
    } catch (e) {
      showToast('上架失败');
    }
  };

  const removeStoreItem = async (id) => {
    if (window.confirm('确定要下架该商品吗？')) {
      try {
        await fetch(`/api/store?id=${id}`, { method: 'DELETE' });
        fetchCloudData();
      } catch(e) {}
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#F472B6', '#A78BFA', '#34D399'] });
  };

  const isImage = (str) => {
    try { return str.startsWith('http') || str.startsWith('data:image'); } catch { return false; }
  };

  const AvatarDisplay = ({ src, size = 'md', className = '' }) => {
    const sizeClass = size === 'lg' ? 'w-16 h-16 text-4xl' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-lg';
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200/20 flex items-center justify-center overflow-hidden border border-white/20 ${className}`}>
        {isImage(src) ? <img src={src} alt="avatar" className="w-full h-full object-cover" /> : <span>{src}</span>}
      </div>
    );
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const cardBgClass = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200 shadow-sm';
  const subTextClass = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div 
      className={`min-h-screen ${bgClass} ${textClass} font-sans transition-colors duration-500 overflow-x-hidden relative selection:bg-pink-500 selection:text-white`}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}
    >
      
      {bgImage && (
        <div className={`fixed inset-0 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-sm z-0`} />
      )}

      {/* 顶部栏 */}
      <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-opacity-80 px-4 py-4 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            元气打卡
          </h1>
          <div className="flex items-center gap-2 mt-1 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={openProfileModal}>
             <AvatarDisplay src={avatar} size="sm" />
             <div className="flex flex-col">
               <p className="text-[10px] font-bold underline">{nickname}</p>
               {loggedInUser && <span className="text-[8px] text-green-400 bg-green-900/30 px-1 rounded w-fit">已登录</span>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 这里的 onClick 修改为 handleOpenStore */}
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-gray-200 shadow-sm'}`} onClick={handleOpenStore}>
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-sm">{points}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {bgImage && (
              <button 
                onClick={() => { setBgImage(''); showToast('背景已恢复默认 ✨'); }} 
                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}
              >
                <RotateCcw size={18} className="text-gray-400 hover:text-white" />
              </button>
            )}
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" id="bg-upload" />
              <label htmlFor="bg-upload" className={`flex p-2 rounded-full cursor-pointer transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}>
                <ImageIcon size={18} className="text-purple-400" />
              </label>
            </div>
          </div>

          {/* 这里的 onClick 修改为 handleOpenStore */}
          <button onClick={handleOpenStore} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}><ShoppingBag size={18} className="text-pink-400" /></button>
          
          <button onClick={() => isAdmin ? setShowAdminPanel(true) : setShowAdminLogin(true)} className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-blue-500/20 text-blue-400' : isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400' : 'bg-white/80 hover:bg-gray-100 text-gray-400 shadow-sm'}`}>{isAdmin ? <Settings size={18} /> : <Lock size={18} />}</button>
          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}>{isDark ? <Moon size={18} /> : <Sun size={18} className="text-orange-500" />}</button>
        </div>
      </header>

      {/* 列表区域 */}
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-md mx-auto space-y-5">
        <AnimatePresence>
          {sortedHabits.map((habit) => {
            const theme = THEMES[habit.theme % THEMES.length] || THEMES[0];
            const isGridTodayDone = habit.type === 'grid' && habit.logs.some(log => log.date.includes(new Date().toLocaleDateString()));

            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative rounded-3xl p-5 border backdrop-blur-xl transition-all ${cardBgClass}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {habit.type === 'streak' ? <div className="bg-orange-100/10 p-1 rounded text-orange-400"><InfinityIcon size={14} /></div> : <div className="bg-purple-100/10 p-1 rounded text-purple-400"><LayoutGrid size={14} /></div>}
                      <h3 className={`text-xl font-bold ${habit.completedToday ? 'line-through opacity-50' : ''}`}>{habit.name}</h3>
                    </div>
                    <p className={`text-xs ${subTextClass}`}>{habit.type === 'streak' ? `已坚持 ${habit.streak} 天` : `挑战进度: ${habit.logs.length} / ${habit.targetDays}`}</p>
                  </div>
                  <div className="flex gap-2">
                    {myCardsCount > 0 && !isGridTodayDone && !habit.completedToday && (
                      <button 
                        onClick={() => useRetroactiveCard(habit.id)}
                        className="flex items-center justify-center p-2 rounded-xl bg-orange-100 text-orange-500 hover:bg-orange-200 transition-colors"
                        title="使用补签卡"
                      >
                        <Ticket size={18} />
                      </button>
                    )}

                    <button onClick={() => requestDeleteHabit(habit.id)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}><Trash2 size={18} /></button>
                    
                    {habit.type === 'streak' ? (
                      <button onClick={() => toggleStreakHabit(habit.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${habit.completedToday ? 'bg-green-500 text-white shadow-lg cursor-not-allowed' : `bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg`}`}>
                        {habit.completedToday ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                      </button>
                    ) : (
                      <button 
                        onClick={() => openGridCheckIn(habit.id)} 
                        disabled={habit.logs.length >= habit.targetDays} 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                          isGridTodayDone
                            ? 'bg-green-500 text-white shadow-lg' 
                            : habit.logs.length >= habit.targetDays 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : `bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg`
                        }`}
                      >
                        {isGridTodayDone ? <CheckCircle2 size={24} /> : <Plus size={24} />}
                      </button>
                    )}
                  </div>
                </div>
                {habit.type === 'grid' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({ length: habit.targetDays }).map((_, index) => {
                      const log = habit.logs[index]; const isDone = !!log;
                      const moodColorClass = isDone ? (MOODS.find(m => m.id === log.mood)?.bg || 'bg-green-500') : '';

                      return (
                        <div key={index} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border relative group transition-colors hover:z-50 ${isDone ? `${moodColorClass} border-transparent text-white` : isDark ? 'bg-slate-900 border-slate-700 text-slate-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          {isDone ? <span>{MOODS.find(m => m.id === log.mood)?.icon || '✨'}</span> : index + 1}
                          {isDone && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[12rem] p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg border border-white/10 z-50">
                              {log.comment ? (
                                <>
                                  <div className="mb-1">{log.comment}</div>
                                  <div className="text-[10px] opacity-50 border-t border-white/10 pt-1 mt-1">{log.date}</div>
                                </>
                              ) : (
                                <div className="text-[10px]">{log.date}</div>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button onClick={() => setShowAddModal(true)} className="pointer-events-auto bg-gradient-to-r from-pink-500 to-violet-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-purple-500/40 flex items-center gap-2 transform transition hover:scale-105 active:scale-95"><Plus size={20} /> 新建目标</button>
      </div>

      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl text-center`}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-lg font-bold mb-2">确认删除?</h3>
                <p className={`text-sm mb-6 ${subTextClass}`}>删除后，所有打卡记录将无法恢复。</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>取消</button>
                  <button onClick={confirmDeleteHabit} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600">删除</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl`}>
              <h2 className="text-xl font-bold mb-4">创建新目标</h2>
              <div className="space-y-4">
                <input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="例如：夜跑 5 公里" />
                
                <div className="flex gap-2">
                  <button onClick={() => setNewHabitType('streak')} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 ${newHabitType === 'streak' ? 'border-purple-500 bg-purple-500/10 text-purple-500' : isDark ? 'border-slate-700' : 'border-gray-200'}`}><InfinityIcon /><span className="text-sm font-bold">无限坚持</span></button>
                  <button onClick={() => setNewHabitType('grid')} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 ${newHabitType === 'grid' ? 'border-purple-500 bg-purple-500/10 text-purple-500' : isDark ? 'border-slate-700' : 'border-gray-200'}`}><LayoutGrid /><span className="text-sm font-bold">格子挑战</span></button>
                </div>
                
                {newHabitType === 'grid' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-medium">
                       <span className={subTextClass}>挑战时长</span>
                       <span className="text-purple-500 font-bold text-base">{targetDays} 天</span>
                    </div>
                    <input type="range" min="7" max="100" value={targetDays} onChange={(e) => setTargetDays(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] opacity-40">
                       <span>7天</span>
                       <span>100天</span>
                    </div>
                  </div>
                )}

                <button onClick={createHabit} className="w-full bg-purple-500 text-white p-4 rounded-xl font-bold mt-4">确认创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 个人资料弹窗 (Updated with Auth) */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 shadow-2xl overflow-hidden`}>
                <h3 className="text-xl font-bold mb-6 text-center">个人资料</h3>
                
                {/* 登录/注册入口 */}
                {!loggedInUser ? (
                  <div className={`mb-6 p-4 rounded-xl border flex flex-col items-center gap-3 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'}`}>
                    <p className={`text-xs ${subTextClass}`}>登录后可同步云端身份和交易记录</p>
                    <div className="flex gap-3 w-full">
                       <button onClick={() => { setShowLoginModal(true); setShowProfileModal(false); }} className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2"><LogIn size={16}/> 登录</button>
                       <button onClick={() => { setShowRegisterModal(true); setShowProfileModal(false); }} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-700'}`}><UserPlus size={16}/> 注册</button>
                    </div>
                  </div>
                ) : (
                   <div className="absolute top-4 right-4">
                     <button onClick={handleLogout} className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="退出登录"><LogOut size={16} /></button>
                   </div>
                )}

                <div className="flex flex-col items-center mb-6">
                   <AvatarDisplay src={editAvatar} size="lg" className="mb-3 ring-4 ring-purple-500/30" />
                   <div className="w-full">
                     <label className={`text-xs ${subTextClass} ml-1 mb-1 block`}>昵称</label>
                     <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                        <Edit3 size={16} className="text-gray-400" />
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold" />
                     </div>
                   </div>
                </div>
                <div className="mb-6">
                   <label className={`text-xs ${subTextClass} ml-1 mb-2 block`}>选择头像 (支持 Emoji 或 本地图片)</label>
                   <div className="flex flex-wrap gap-2 mb-3 justify-center">
                      {AVATAR_PRESETS.map(emoji => (
                         <button key={emoji} onClick={() => setEditAvatar(emoji)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${editAvatar === emoji ? 'bg-purple-500 text-white scale-110 shadow-lg' : isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{emoji}</button>
                      ))}
                   </div>
                   <div className="relative">
                     <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="avatar-upload" />
                     <label htmlFor="avatar-upload" className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${isDark ? 'border-slate-700 bg-slate-900 hover:bg-slate-800' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                       <Camera size={18} className="text-gray-400" />
                       <span className={`text-xs ${subTextClass}`}>点击上传本地图片</span>
                     </label>
                   </div>
                </div>
                
                <div className="space-y-3">
                  <button onClick={saveProfile} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-purple-500/30">保存修改</button>
                  {loggedInUser && (
                     <div className="text-center">
                        <button onClick={() => setShowDeleteAccountModal(true)} className="text-[10px] text-red-500/60 hover:text-red-500 underline decoration-red-500/20 hover:decoration-red-500 transition-all flex items-center justify-center gap-1 mx-auto"><UserMinus size={12}/> 注销账号</button>
                     </div>
                  )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录弹窗 */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl`}>
                <h3 className="text-lg font-bold mb-4 text-center">登录账号</h3>
                <div className="space-y-3">
                   <input value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="用户名" />
                   <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="密码" />
                   <button onClick={handleLogin} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold mt-2">登录</button>
                   {/* 找回密码入口 */}
                   <button 
                     onClick={() => { setShowLoginModal(false); setShowForgotModal(true); }}
                     className="w-full text-xs text-blue-400 hover:underline"
                   >
                     忘记密码？
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 找回密码弹窗 (新增) */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForgotModal(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl`}>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-lg font-bold mb-4 text-center">找回密码</h3>
                <p className={`text-xs ${subTextClass} text-center mb-4`}>使用注册时的邀请码验证身份并重置密码</p>
                <div className="space-y-3">
                   <input value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="用户名" />
                   <input value={authForm.inviteCode} onChange={e => setAuthForm({...authForm, inviteCode: e.target.value})} className={`w-full p-3 rounded-xl outline-none border text-center tracking-widest ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="邀请码" />
                   <input type="password" value={authForm.newPassword} onChange={e => setAuthForm({...authForm, newPassword: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="设置新密码" />
                   <button onClick={handleResetPassword} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold mt-2">重置密码</button>
                   <button onClick={() => { setShowForgotModal(false); setShowLoginModal(true); }} className="w-full text-xs opacity-60 hover:opacity-100 mt-2">返回登录</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 注册弹窗 */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl`}>
                <h3 className="text-lg font-bold mb-4 text-center">注册新账号</h3>
                <div className="space-y-3">
                   <input value={authForm.inviteCode} onChange={e => setAuthForm({...authForm, inviteCode: e.target.value})} className={`w-full p-3 rounded-xl outline-none border text-center tracking-widest ${isDark ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}`} placeholder="输入邀请码" />
                   <input value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="设置用户名" />
                   <input value={authForm.nickname} onChange={e => setAuthForm({...authForm, nickname: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="设置昵称 (选填)" />
                   <input type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="设置密码" />
                   <button onClick={handleRegister} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold mt-2">验证并注册</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 注销账号确认弹窗 */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteAccountModal(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl text-center border-2 border-red-500/20`}>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                  <UserMinus size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2">确认注销账号？</h3>
                <p className="text-xs text-red-400 mb-4 px-2">此操作将永久删除您的账号及所有数据，且不可恢复。</p>
                
                <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} className={`w-full p-3 rounded-xl mb-4 text-center outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="输入密码以确认" />
                
                <button onClick={confirmDeleteAccount} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30">确认注销</button>
                <button onClick={() => setShowDeleteAccountModal(false)} className={`mt-3 text-xs ${subTextClass} underline`}>取消</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理员验证弹窗 */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl`}>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-500"><Lock size={24} /></div>
                  <h3 className="text-lg font-bold">管理员验证</h3>
                </div>
                <input type="password" autoFocus value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full p-3 rounded-xl mb-4 text-center text-lg tracking-widest outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="●●●●" />
                <button onClick={handleAdminLogin} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold">验证身份</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 积分商店弹窗 */}
      <AnimatePresence>
        {showStoreModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStoreModal(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="text-pink-400" /> 积分商店</h2>
                   <div className="flex gap-2 items-center">
                     <p className={`text-xs ${subTextClass} mt-1`}>您的积分: <span className="text-yellow-400 font-bold">{points}</span></p>
                     <p className={`text-xs ${subTextClass} mt-1 border-l pl-2 ml-2 border-gray-600`}>补签卡: <span className="text-orange-400 font-bold">{myCardsCount}</span></p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={fetchCloudData} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><RefreshCw size={18} className={isLoadingCloud ? "animate-spin" : ""} /></button>
                   <button onClick={() => setShowStoreModal(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><X size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pb-4 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {storeItems.map(item => (
                    <div key={item.id} className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-4xl mb-1">{item.icon}</div>
                      <div className="font-bold">{item.name}</div>
                      <div className={`text-[10px] ${subTextClass}`}>{item.desc}</div>
                      <button onClick={() => buyItem(item)} disabled={points < item.cost} className={`mt-2 w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${points >= item.cost ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}><Coins size={12} /> {item.cost}</button>
                    </div>
                  ))}
                  {storeItems.length === 0 && <div className="col-span-2 text-center text-xs opacity-50 py-8">商店暂无商品 (或 D1 未连接)</div>}
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Receipt size={14}/> 我的兑换记录</h3>
                  <div className="space-y-2">
                    {transactions.filter(t => t.user_id === userId).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs opacity-80">
                         <span>{t.date_str || '刚刚'} 兑换了 {t.item_icon} {t.item_name}</span>
                         <span className="text-red-400 font-mono">-{t.cost}</span>
                      </div>
                    ))}
                    {transactions.filter(t => t.user_id === userId).length === 0 && <p className="text-[10px] text-center opacity-50">暂无记录</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理员后台 (Updated with User Management) */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminPanel(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, y: 50 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="text-blue-400" /> D1 后台管理</h2>
                <div className="flex gap-2">
                   <button onClick={fetchCloudData} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><RefreshCw size={18} className={isLoadingCloud ? "animate-spin" : ""} /></button>
                   <button onClick={() => setShowAdminPanel(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><X size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                
                {/* 用户管理 (新增) */}
                <section>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-blue-400"><Users size={14} /> 用户管理</h3>
                  <div className={`rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                    {adminUsers.map(u => (
                      <div key={u.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5 last:border-0">
                         <div className="flex items-center gap-2">
                            <AvatarDisplay src={u.avatar} size="sm" />
                            <div className="flex flex-col">
                               <span className="font-bold">{u.nickname}</span>
                               <span className="opacity-60 text-[9px] font-mono">@{u.username}</span>
                            </div>
                         </div>
                         <button onClick={() => adminDeleteUser(u.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    {adminUsers.length === 0 && <p className="text-[10px] text-center opacity-50">暂无用户</p>}
                  </div>
                </section>

                {/* 邀请码管理 */}
                <section>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-green-400"><Key size={14} /> 注册邀请码管理</h3>
                  <div className={`p-3 rounded-xl mb-3 flex items-center justify-between ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`}>
                     <span className="text-xs font-bold opacity-60">生成新的随机邀请码</span>
                     <button onClick={generateInviteCode} className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg font-bold">生成</button>
                  </div>
                  <div className={`rounded-xl p-3 max-h-32 overflow-y-auto grid grid-cols-2 gap-2 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                    {inviteCodes.map(code => (
                      <div key={code.code} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${code.is_used ? 'opacity-40' : ''} ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                        <span className="font-mono font-bold tracking-wider">{code.code}</span>
                        {code.is_used ? (
                          <span className="text-[10px]">已用</span>
                        ) : (
                          <button onClick={() => copyToClipboard(code.code)} className="text-blue-400 hover:text-white"><Copy size={12}/></button>
                        )}
                      </div>
                    ))}
                    {inviteCodes.length === 0 && <p className="col-span-2 text-center text-[10px] opacity-50">暂无邀请码</p>}
                  </div>
                </section>

                <section>
                   <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-purple-400"><Gift size={14} /> 商品管理</h3>
                   <div className="flex gap-2 mb-2">
                      <input placeholder="名称" value={adminItemName} onChange={e => setAdminItemName(e.target.value)} className={`flex-1 p-2 rounded-lg text-xs outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                      <input placeholder="价格" type="number" value={adminItemCost} onChange={e => setAdminItemCost(Number(e.target.value))} className={`w-16 p-2 rounded-lg text-xs outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                      <input placeholder="图标" value={adminItemIcon} onChange={e => setAdminItemIcon(e.target.value)} className={`w-12 p-2 rounded-lg text-xs outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                      <button onClick={addStoreItem} className="px-3 bg-blue-500 text-white rounded-lg text-xs font-bold">上架</button>
                   </div>
                   <div className="space-y-2">
                     {storeItems.map(item => (
                       <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
                         <div className="flex items-center gap-2"><span>{item.icon}</span><span>{item.name}</span></div>
                         <button onClick={() => removeStoreItem(item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                       </div>
                     ))}
                   </div>
                </section>
                <section>
                   <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-yellow-400"><History size={14} /> 全员消费流水</h3>
                   <div className={`rounded-xl p-3 max-h-40 overflow-y-auto ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                      {transactions.length === 0 ? <p className="text-[10px] opacity-50 text-center">暂无消费记录</p> : 
                        transactions.map(t => (
                          <div key={t.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5 last:border-0">
                             <div className="flex items-center gap-2">
                                <AvatarDisplay src={t.userAvatar || '🤠'} size="sm" />
                                <div className="flex flex-col">
                                   <span className="font-bold text-blue-300">{t.user_name}</span>
                                   <span className="opacity-60 text-[9px]">{t.date_str}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span>{t.item_icon} {t.item_name}</span>
                                <span className="font-bold text-red-400">-{t.cost}</span>
                             </div>
                          </div>
                        ))
                      }
                   </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid打卡 & Toast */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckInModal(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 shadow-2xl`}>
              <h3 className="text-xl font-bold mb-6 text-center">打卡记录</h3>
              <div className="flex justify-between mb-6 px-2">{MOODS.map((m) => (<button key={m.id} onClick={() => setCheckInMood(m.id)} className={`flex flex-col items-center gap-1 transition-all ${checkInMood === m.id ? 'scale-125' : 'opacity-50'}`}><div className={`${checkInMood === m.id ? m.color : 'text-gray-400'}`}>{m.icon}</div><span className="text-xs font-bold mt-1 text-gray-500">{m.label}</span></button>))}</div>
              <textarea value={checkInComment} onChange={(e) => setCheckInComment(e.target.value)} placeholder="写点什么..." className={`w-full p-3 rounded-xl mb-6 outline-none ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`} />
              <button onClick={submitGridCheckIn} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-xl font-bold">完成打卡 (+1 积分)</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: -50, x: "-50%" }} 
            className="fixed top-20 left-1/2 bg-white/90 backdrop-blur text-slate-900 px-6 py-3 rounded-full shadow-2xl font-bold z-[60] text-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
