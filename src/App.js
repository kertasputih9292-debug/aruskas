import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, Briefcase, Trash2, Edit, AlertCircle, Clock, Utensils, 
  Send, Plane, LayoutDashboard, Layers, ChevronRight, Menu, X, 
  ChevronDown, LogOut, PlusCircle, Filter, Calculator, BookOpen, 
  Pencil, Calendar, RefreshCw, Receipt, 
  Zap, PenTool, FileText, Router, Monitor, Banknote, Package, Server, Cloud, Printer, Scissors, Check, AlertTriangle,
  MapPin, TrendingUp, CheckCircle, XCircle, Lightbulb, Eye, EyeOff, ToggleLeft, ToggleRight
} from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFdFFd0-ekvC6di-RUXHBOvMMun67ytCBcrzORG-Ip0Q_I3oQb51Te3OvglHYPhxb-/exec';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

const getCategoryIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('listrik') || lower.includes('daya') || lower.includes('token')) return Zap;
  if (lower.includes('atk') || lower.includes('tulis') || lower.includes('alat kantor') || lower.includes('pensil')) return PenTool;
  if (lower.includes('kertas') || lower.includes('cover') || lower.includes('dokumen') || lower.includes('fotokopi')) return FileText;
  if (lower.includes('jaringan') || lower.includes('router') || lower.includes('wifi') || lower.includes('internet')) return Router;
  if (lower.includes('komputer') || lower.includes('pc') || lower.includes('laptop') || lower.includes('hardware')) return Monitor;
  if (lower.includes('honor') || lower.includes('gaji') || lower.includes('jasa') || lower.includes('uang')) return Banknote;
  if (lower.includes('server') || lower.includes('hosting') || lower.includes('domain')) return Server;
  if (lower.includes('langganan') || lower.includes('cloud') || lower.includes('zoom')) return Cloud;
  if (lower.includes('cetak') || lower.includes('printer') || lower.includes('tinta')) return Printer;
  return Package; 
};

const AnimatedNominal = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const actualValueRef = useRef(0);

  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    const duration = 1000;
    const targetValue = parseFloat(value) || 0;
    const startValue = actualValueRef.current;

    if (targetValue === startValue) {
        setDisplayValue(targetValue);
        return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const nextValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
      setDisplayValue(nextValue);
      actualValueRef.current = nextValue;
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
        actualValueRef.current = targetValue;
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  return <span>{formatRp(displayValue)}</span>;
};

const ProgressBar = ({ realisasi, pagu }) => {
  const [width, setWidth] = useState(0);
  const percentValue = pagu > 0 ? (realisasi / pagu) * 100 : 0;
  const safePercent = Math.min(Math.max(percentValue, 0), 100);
  
  let colorClass = 'bg-emerald-500'; 
  if (percentValue >= 80) colorClass = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'; 
  else if (percentValue >= 50) colorClass = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'; 

  useEffect(() => {
    const timer = setTimeout(() => setWidth(safePercent), 300);
    return () => clearTimeout(timer);
  }, [safePercent]);

  return (
    <div className="w-full bg-slate-100/80 h-1.5 md:h-2 rounded-full mt-2.5 overflow-hidden flex shadow-inner relative">
      <div className={`h-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${width}%` }}></div>
    </div>
  );
};

const formatRibuan = (angka) => {
  if (!angka) return '';
  return new Intl.NumberFormat('id-ID').format(angka.toString().replace(/[^0-9]/g, ''));
};
const parseRibuan = (str) => parseInt(str?.toString().replace(/[^0-9]/g, ''), 10) || 0;
const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

const parseKategori = (item) => {
  if (item.kategori_belanja && item.kategori_belanja.startsWith('[')) {
    try { return JSON.parse(item.kategori_belanja); } catch(e){}
  }
  const arr = [];
  if (item.pagu_anggaran !== undefined && item.pagu_anggaran !== '') arr.push({ nama: 'Makan Minum Rapat', nominal: item.pagu_anggaran });
  if (item.pagu_perdin !== undefined && item.pagu_perdin !== '') arr.push({ nama: 'Perjalanan Dinas', nominal: item.pagu_perdin });
  return arr;
};

const getPaguKategoriByName = (subItem, kategoriName) => {
  const arr = parseKategori(subItem);
  const found = arr.find(x => x.nama === kategoriName);
  return found ? parseRibuan(found.nominal) : 0;
};

const getPaguKategori = (subItem, type) => {
  const arr = parseKategori(subItem);
  const found = arr.find(x => {
    const low = x.nama.toLowerCase();
    if (type === 'mamin') return low.includes('makan minum') || low.includes('mamin');
    if (type === 'perdin') return low.includes('perjalanan dinas') || low.includes('perdin');
    return false;
  });
  return found ? parseRibuan(found.nominal) : 0;
};

const getPerdinTotal = (item) => {
  let calc = 0;
  if (item.rincian_peserta) {
    try {
      const arr = JSON.parse(item.rincian_peserta);
      calc = arr.reduce((sum, p) => sum + parseRibuan(p.nominal), 0);
    } catch (e) {}
  }
  const dbVal = parseFloat(item.total_nominal);
  return dbVal > 0 ? dbVal : calc;
};

const isRealized = (item) => {
  if (item.status_realisasi === '0' || item.status_realisasi === false || item.status_realisasi === 'false') return false;
  return true; 
};

export default function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [dataMamin, setDataMamin] = useState([]);
  const [dataSub, setDataSub] = useState([]); 
  const [dataPerdin, setDataPerdin] = useState([]); 
  
  const currentMamin = dataMamin.filter(item => selectedYear === 'Semua' ? true : (item.tahun ? String(item.tahun) : '2026') === String(selectedYear));
  const currentSub = dataSub.filter(item => selectedYear === 'Semua' ? true : (item.tahun ? String(item.tahun) : '2026') === String(selectedYear));
  const currentPerdin = dataPerdin.filter(item => selectedYear === 'Semua' ? true : (item.tahun ? String(item.tahun) : '2026') === String(selectedYear));

  const allCategoriesSet = new Set();
  currentSub.forEach(sub => {
    parseKategori(sub).forEach(k => {
      const low = k.nama.toLowerCase();
      if (!low.includes('makan minum') && !low.includes('mamin') && !low.includes('perjalanan dinas') && !low.includes('perdin')) {
        allCategoriesSet.add(toTitleCase(k.nama));
      }
    });
  });
  const dynamicCategories = Array.from(allCategoriesSet).sort();

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: '', targetSheet: '', title: '', message: '', targetId: null });
  
  const [expandedMaminSub, setExpandedMaminSub] = useState(null);
  const [expandedMaminRow, setExpandedMaminRow] = useState(null);
  const toggleMaminSub = (sub) => setExpandedMaminSub(prev => prev === sub ? null : sub);
  const toggleMaminRow = (id) => setExpandedMaminRow(prev => prev === id ? null : id);

  const [expandedDashSubs, setExpandedDashSubs] = useState([]);
  const toggleDashSub = (sub) => setExpandedDashSubs(prev => prev.includes(sub) ? prev.filter(n => n !== sub) : [...prev, sub]);

  const [currentPagePerdin, setCurrentPagePerdin] = useState(1);
  const itemsPerPage = 5;

  const [formSub, setFormSub] = useState({ 
    id: '', nama_sub: '', tahun: '2026', 
    kategori: [{ nama: 'Makan Minum Rapat', nominal: '' }, { nama: 'Perjalanan Dinas', nominal: '' }] 
  });
  const [formMamin, setFormMamin] = useState({ 
    id: '', sub_kegiatan: '', kategori_belanja: 'Makan Minum Rapat', pagu_mamin: '', pagu_bulanan: '', nama_rapat: '', tanggal_rapat: '', 
    jumlah_paket: '', is_auto: true, qty_nasi: '', harga_nasi: '', qty_snack: '', harga_snack: '' 
  });
  
  const [perdinMode, setPerdinMode] = useState('input');
  const [draftCart, setDraftCart] = useState([]);
  const [formPerdin, setFormPerdin] = useState({
    id: '', sub_kegiatan: '', tujuan: '', lokasi: '', peserta: [{ nama: '', nominal: '' }]
  });
  const [predictForm, setPredictForm] = useState({ sub_kegiatan: '', lokasi: '', estimasi_biaya: '' });

  const [formDynamic, setFormDynamic] = useState({
    id: '', sub_kegiatan: '', keterangan: '', tanggal: '', nominal: '', pagu: 0
  });

  const [filterPerdin, setFilterPerdin] = useState('Semua');

  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [perdinDiscountPct, setPerdinDiscountPct] = useState('');
  const [savedPerdinDiscount, setSavedPerdinDiscount] = useState(() => {
    const saved = localStorage.getItem('perdinDiscount_' + selectedYear);
    return saved ? parseFloat(saved) : 0;
  });

  const [showGlobalCards, setShowGlobalCards] = useState(() => {
    const saved = localStorage.getItem('showGlobalCards');
    return saved ? JSON.parse(saved) : true;
  });

  const toggleGlobalCards = () => {
    const newVal = !showGlobalCards;
    setShowGlobalCards(newVal);
    localStorage.setItem('showGlobalCards', JSON.stringify(newVal));
  };

  useEffect(() => {
    const saved = localStorage.getItem('perdinDiscount_' + selectedYear);
    setSavedPerdinDiscount(saved ? parseFloat(saved) : 0);
  }, [selectedYear]);

  const handleSaveDiscount = () => {
    const val = parseFloat(perdinDiscountPct) || 0;
    setSavedPerdinDiscount(val);
    localStorage.setItem('perdinDiscount_' + selectedYear, val);
    setIsEditingDiscount(false);
  };

  const isAutoMode = formMamin.is_auto !== false;
  let realisasiAnggaranRapat = 0;
  let totalHargaNego = 0;
  let jumlahPaketTersimpan = '';

  if (isAutoMode) {
    const jumlahPaket = parseRibuan(formMamin.jumlah_paket);
    totalHargaNego = jumlahPaket * 61700;
    realisasiAnggaranRapat = totalHargaNego + (totalHargaNego * 0.10);
    jumlahPaketTersimpan = formMamin.jumlah_paket; 
  } else {
    const qNasi = parseRibuan(formMamin.qty_nasi), hNasi = parseRibuan(formMamin.harga_nasi);
    const qSnack = parseRibuan(formMamin.qty_snack), hSnack = parseRibuan(formMamin.harga_snack);
    totalHargaNego = (qNasi * hNasi) + (qSnack * hSnack);
    realisasiAnggaranRapat = totalHargaNego + (totalHargaNego * 0.10);
    jumlahPaketTersimpan = `Nasi: ${qNasi} (@ ${hNasi}) | Snack: ${qSnack} (@ ${hSnack})`; 
  }

  const paguMamin = parseRibuan(formMamin.pagu_mamin);
  const historyExcludingCurrent = currentMamin
    .filter(item => item.id !== formMamin.id && item.sub_kegiatan === formMamin.sub_kegiatan && item.kategori_belanja === formMamin.kategori_belanja)
    .reduce((sum, item) => sum + (parseFloat(item.realisasi_anggaran) || 0), 0);
  const realisasiTotal = historyExcludingCurrent + realisasiAnggaranRapat;
  const sisaMamin = paguMamin - realisasiTotal;

  useEffect(() => {
    if (formMamin.pagu_mamin && !isEditing && realisasiAnggaranRapat > 0) {
      setFormMamin(prev => ({ ...prev, pagu_bulanan: formatRibuan(realisasiAnggaranRapat) }));
    }
  }, [formMamin.pagu_mamin, realisasiAnggaranRapat, isEditing]);

  const currentTotalPerdin = formPerdin.peserta.reduce((sum, p) => sum + parseRibuan(p.nominal), 0);
  let currentPaguPerdinSummary = 0;
  if (filterPerdin === 'Semua') {
    currentPaguPerdinSummary = currentSub.reduce((sum, s) => sum + getPaguKategori(s, 'perdin'), 0);
  } else {
    const s = currentSub.find(sub => sub.nama_sub === filterPerdin);
    if (s) currentPaguPerdinSummary = getPaguKategori(s, 'perdin');
  }

  const historyPerdinSum = currentPerdin
    .filter(item => filterPerdin === 'Semua' ? true : item.sub_kegiatan === filterPerdin)
    .filter(isRealized)
    .reduce((sum, item) => sum + getPerdinTotal(item), 0); 
  const sisaPerdinSummary = currentPaguPerdinSummary - historyPerdinSum;

  const filteredPerdinData = currentPerdin.filter(item => filterPerdin === 'Semua' ? true : item.sub_kegiatan === filterPerdin);
  const totalPagesPerdin = Math.ceil(filteredPerdinData.length / itemsPerPage);
  const paginatedPerdinData = filteredPerdinData.slice((currentPagePerdin - 1) * itemsPerPage, currentPagePerdin * itemsPerPage);

  const globalPerdinCosts = {};
  currentPerdin.forEach(p => {
      if (!p.lokasi) return;
      const loc = toTitleCase(p.lokasi.trim());
      if(!globalPerdinCosts[loc]) globalPerdinCosts[loc] = { name: loc, total: 0, count: 0 };
      globalPerdinCosts[loc].total += getPerdinTotal(p);
      globalPerdinCosts[loc].count += 1;
  });
  const suggestionList = Object.values(globalPerdinCosts).map(c => ({ lokasi: c.name, avgCost: c.total / c.count })).sort((a,b) => a.lokasi.localeCompare(b.lokasi));

  let sisaAnggaranPredict = 0;
  if (predictForm.sub_kegiatan) {
      const sData = currentSub.find(s => s.nama_sub === predictForm.sub_kegiatan);
      if (sData) {
          const pagu = getPaguKategori(sData, 'perdin');
          const history = currentPerdin.filter(p => p.sub_kegiatan === predictForm.sub_kegiatan).filter(isRealized).reduce((sum, item) => sum + getPerdinTotal(item), 0);
          const sisaAwal = pagu - history;
          sisaAnggaranPredict = savedPerdinDiscount > 0 ? sisaAwal - (sisaAwal * (savedPerdinDiscount / 100)) : sisaAwal;
      }
  }
  const totalDraftCost = draftCart.reduce((sum, item) => sum + item.biaya, 0);
  const sisaSetelahPredict = sisaAnggaranPredict - totalDraftCost;
  const isPredictSafe = sisaSetelahPredict >= 0;

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setFormSub(prev => ({ ...prev, tahun: selectedYear === 'Semua' ? '2026' : selectedYear })); }, [selectedYear]);

  const fetchData = async (showLoader = true) => {
    if (!SCRIPT_URL.startsWith('http')) return;
    if (showLoader && isEntered) setIsRefreshing(true); 
    try {
      const [resMamin, resSub, resPerdin] = await Promise.all([
        fetch(`${SCRIPT_URL}?sheet=Sheet1`),
        fetch(`${SCRIPT_URL}?sheet=SubKegiatan`),
        fetch(`${SCRIPT_URL}?sheet=Perdin`)
      ]);
      const [jsonMamin, jsonSub, jsonPerdin] = await Promise.all([resMamin.json(), resSub.json(), resPerdin.json()]);
      
      if (jsonMamin.status === 'success') setDataMamin(jsonMamin.data.map(i => Object.fromEntries(Object.entries(i).map(([k, v]) => [k.trim(), v]))));
      if (jsonSub.status === 'success') setDataSub(jsonSub.data.map(i => Object.fromEntries(Object.entries(i).map(([k, v]) => [k.trim(), v]))));
      if (jsonPerdin.status === 'success') setDataPerdin(jsonPerdin.data.map(i => Object.fromEntries(Object.entries(i).map(([k, v]) => [k.trim(), v]))));
    } catch (error) { console.error('Fetch error:', error); }
    if (showLoader && isEntered) setIsRefreshing(false);
  };

  const handleInputMamin = (e) => {
    const { name, value } = e.target;
    if (name === 'sub_kegiatan') {
      const selectedSub = currentSub.find(sub => sub.nama_sub === value);
      const arr = selectedSub ? parseKategori(selectedSub) : [];
      const maminCat = arr.find(x => x.nama.toLowerCase().includes('makan minum') || x.nama.toLowerCase().includes('mamin'));
      const catName = maminCat ? maminCat.nama : 'Makan Minum Rapat';
      
      setFormMamin(prev => ({ ...prev, [name]: value, kategori_belanja: catName, pagu_mamin: selectedSub ? formatRibuan(maminCat ? maminCat.nominal : 0) : prev.pagu_mamin }));
    } 
    else if (['pagu_mamin', 'pagu_bulanan', 'jumlah_paket', 'qty_nasi', 'harga_nasi', 'qty_snack', 'harga_snack'].includes(name)) {
      setFormMamin({ ...formMamin, [name]: formatRibuan(value) });
    } else {
      setFormMamin({ ...formMamin, [name]: value });
    }
  };

  const handleInputSub = (e) => {
    const { name, value } = e.target;
    setFormSub({ ...formSub, [name]: value });
  };

  const handleInputPerdin = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'lokasi' || name === 'tujuan') formattedValue = toTitleCase(value);
    setFormPerdin({ ...formPerdin, [name]: formattedValue });
  };

  const handlePesertaChange = (index, field, value) => {
    const updatedPeserta = [...formPerdin.peserta];
    let formattedValue = value;
    if (field === 'nama') {
      formattedValue = toTitleCase(value);
    } else if (field === 'nominal') {
      formattedValue = formatRibuan(value);
    }
    updatedPeserta[index][field] = formattedValue;
    setFormPerdin({ ...formPerdin, peserta: updatedPeserta });
  };

  const addPeserta = () => {
    setFormPerdin({ ...formPerdin, peserta: [...formPerdin.peserta, { nama: '', nominal: '' }] });
  };

  const removePeserta = (index) => {
    const updatedPeserta = formPerdin.peserta.filter((_, i) => i !== index);
    setFormPerdin({ ...formPerdin, peserta: updatedPeserta });
  };

  const addToCart = () => {
    if (!predictForm.lokasi || !predictForm.estimasi_biaya) return;
    setDraftCart([...draftCart, { 
       lokasi: predictForm.lokasi, 
       biaya: parseRibuan(predictForm.estimasi_biaya),
       id: Date.now()
    }]);
    setPredictForm({...predictForm, lokasi: '', estimasi_biaya: ''});
  };

  const removeFromCart = (id) => {
    setDraftCart(draftCart.filter(item => item.id !== id));
  };

  const handleInputDynamic = (e) => {
    const { name, value } = e.target;
    if (name === 'sub_kegiatan') {
       const catName = activeTab.replace('dynamic_', '');
       const selectedSub = currentSub.find(sub => sub.nama_sub === value);
       const paguKat = selectedSub ? getPaguKategoriByName(selectedSub, catName) : 0;
       setFormDynamic(prev => ({ ...prev, [name]: value, pagu: paguKat }));
    } else if (name === 'nominal') {
       setFormDynamic({ ...formDynamic, [name]: formatRibuan(value) });
    } else {
       setFormDynamic({ ...formDynamic, [name]: value });
    }
  };

  const toggleRealisasiPerdin = async (item) => {
    const newStatus = isRealized(item) ? '0' : '1';
    const updatedItem = { ...item, status_realisasi: newStatus };
    
    setDataPerdin(prev => prev.map(p => p.id === item.id ? updatedItem : p));
    
    try {
      await fetch(SCRIPT_URL, { 
        method: 'POST', 
        body: JSON.stringify({ sheet: 'Perdin', action: 'update', data: updatedItem }) 
      });
    } catch (error) { 
      console.error('Error toggling status:', error); 
      setDataPerdin(prev => prev.map(p => p.id === item.id ? item : p));
    }
  };

  const triggerSave = (e, targetSheet) => {
    e.preventDefault();
    let msg = '';
    if (targetSheet === 'Sheet1') msg = `Simpan data Rapat "${formMamin.nama_rapat}" dengan realisasi ${formatRp(realisasiAnggaranRapat)}?`;
    else if (targetSheet === 'SubKegiatan') msg = `Simpan Master Sub Kegiatan "${formSub.nama_sub}" untuk Tahun ${formSub.tahun || selectedYear}?`;
    else if (targetSheet === 'Perdin') msg = `Simpan data Perjalanan Dinas ke "${formPerdin.lokasi}" dengan total ${formatRp(currentTotalPerdin)}?`;
    else if (targetSheet === 'Dynamic') msg = `Simpan data "${formDynamic.keterangan}" dengan realisasi ${formatRp(parseRibuan(formDynamic.nominal))}?`;

    setDialog({ isOpen: true, type: 'save', targetSheet, title: isEditing ? 'Konfirmasi Pembaruan' : 'Konfirmasi Simpan', message: msg, targetId: null });
  };

  const triggerDelete = (id, nama, targetSheet) => {
    setDialog({ isOpen: true, type: 'delete', targetSheet, title: 'Konfirmasi Hapus', message: `Hapus "${nama}"? Data tidak dapat dikembalikan.`, targetId: id });
  };

  const executeAction = async () => {
    const { type, targetId, targetSheet } = dialog;
    const currentIsEditing = isEditing;
    setDialog({ ...dialog, isOpen: false });
    if (!SCRIPT_URL.startsWith('http')) { alert('URL Web App belum diatur!'); return; }
    
    let payloadData = null;
    let sheetNameAPI = targetSheet;
    const activeYearSave = selectedYear === 'Semua' ? '2026' : selectedYear;

    if (type === 'save') {
      if (targetSheet === 'Sheet1') {
        const catName = formMamin.kategori_belanja || 'Makan Minum Rapat';
        payloadData = { ...formMamin, pagu_mamin: parseRibuan(formMamin.pagu_mamin), pagu_bulanan: parseRibuan(formMamin.pagu_bulanan), jumlah_paket: jumlahPaketTersimpan, realisasi_anggaran: realisasiAnggaranRapat, tahun: activeYearSave, kategori_belanja: catName };
      } else if (targetSheet === 'SubKegiatan') {
        const kategoriStr = JSON.stringify(formSub.kategori);
        let pMamin = 0, pPerdin = 0;
        formSub.kategori.forEach(k => {
           const low = k.nama.toLowerCase();
           if (low.includes('makan minum') || low.includes('mamin')) pMamin = parseRibuan(k.nominal);
           if (low.includes('perjalanan dinas') || low.includes('perdin')) pPerdin = parseRibuan(k.nominal);
        });
        payloadData = { id: formSub.id, nama_sub: formSub.nama_sub, kategori_belanja: kategoriStr, pagu_anggaran: pMamin, pagu_perdin: pPerdin, tahun: formSub.tahun || activeYearSave };
      } else if (targetSheet === 'Perdin') {
        payloadData = { id: formPerdin.id, sub_kegiatan: formPerdin.sub_kegiatan, tujuan: formPerdin.tujuan, lokasi: formPerdin.lokasi, rincian_peserta: JSON.stringify(formPerdin.peserta), total_nominal: currentTotalPerdin, tahun: activeYearSave, status_realisasi: '1' };
      } else if (targetSheet === 'Dynamic') {
        const catName = activeTab.replace('dynamic_', '');
        payloadData = { id: formDynamic.id, sub_kegiatan: formDynamic.sub_kegiatan, kategori_belanja: catName, nama_rapat: formDynamic.keterangan, tanggal_rapat: formDynamic.tanggal, realisasi_anggaran: parseRibuan(formDynamic.nominal), tahun: activeYearSave };
        sheetNameAPI = 'Sheet1'; 
      }

      const optimisticData = { ...payloadData, id: currentIsEditing ? payloadData.id : 'temp-' + Date.now() };

      if (targetSheet === 'Sheet1') {
        setDataMamin(prev => currentIsEditing ? prev.map(item => item.id === payloadData.id ? optimisticData : item) : [...prev, optimisticData]);
        setFormMamin({ id: '', sub_kegiatan: '', kategori_belanja: 'Makan Minum Rapat', pagu_mamin: '', pagu_bulanan: '', nama_rapat: '', tanggal_rapat: '', jumlah_paket: '', is_auto: true, qty_nasi: '', harga_nasi: '', qty_snack: '', harga_snack: '' });
      } else if (targetSheet === 'SubKegiatan') {
        setDataSub(prev => currentIsEditing ? prev.map(item => item.id === payloadData.id ? optimisticData : item) : [...prev, optimisticData]);
        setFormSub({ id: '', nama_sub: '', tahun: selectedYear === 'Semua' ? '2026' : selectedYear, kategori: [{ nama: 'Makan Minum Rapat', nominal: '' }, { nama: 'Perjalanan Dinas', nominal: '' }] });
      } else if (targetSheet === 'Perdin') {
        setDataPerdin(prev => currentIsEditing ? prev.map(item => item.id === payloadData.id ? optimisticData : item) : [...prev, optimisticData]);
        setFormPerdin({ id: '', sub_kegiatan: '', tujuan: '', lokasi: '', peserta: [{ nama: '', nominal: '' }] });
        setCurrentPagePerdin(1);
        setPerdinMode('input'); 
      } else if (targetSheet === 'Dynamic') {
        setDataMamin(prev => currentIsEditing ? prev.map(item => item.id === payloadData.id ? optimisticData : item) : [...prev, optimisticData]);
        setFormDynamic({ id: '', sub_kegiatan: '', keterangan: '', tanggal: '', nominal: '', pagu: 0 });
      }
      setIsEditing(false);
    } else if (type === 'delete') {
      if (targetSheet === 'Sheet1' || targetSheet === 'Dynamic') {
        setDataMamin(prev => prev.filter(item => item.id !== targetId));
        sheetNameAPI = 'Sheet1';
      } else if (targetSheet === 'SubKegiatan') setDataSub(prev => prev.filter(item => item.id !== targetId));
      else if (targetSheet === 'Perdin') {
        setDataPerdin(prev => prev.filter(item => item.id !== targetId));
        setCurrentPagePerdin(1);
      }
    }

    try {
      const payload = type === 'save'
        ? { sheet: sheetNameAPI, action: currentIsEditing ? 'update' : 'create', data: payloadData }
        : { sheet: sheetNameAPI, action: 'delete', data: { id: targetId } };

      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
      const result = await res.json();
      
      if (result.status === 'success') fetchData(false); 
      else { alert('Gagal sinkronisasi: ' + result.message); fetchData(false); }
    } catch (error) { 
      console.error('Error sync:', error); fetchData(false); 
    }
  };

  const editData = (item, targetSheet) => {
    if (targetSheet === 'Sheet1') {
      const rawDate = item.tanggal_rapat ? String(item.tanggal_rapat).substring(0, 10) : '';
      let isAuto = true, qNasi = '', hNasi = '', qSnack = '', hSnack = '', jPaket = '';
      if (String(item.jumlah_paket).includes('Nasi:')) {
         isAuto = false;
         const match = String(item.jumlah_paket).match(/Nasi:\s*(\d+)\s*\(@\s*(\d+)\)\s*\|\s*Snack:\s*(\d+)\s*\(@\s*(\d+)\)/);
         if (match) {
            qNasi = formatRibuan(match[1]); hNasi = formatRibuan(match[2]);
            qSnack = formatRibuan(match[3]); hSnack = formatRibuan(match[4]);
         }
      } else jPaket = formatRibuan(item.jumlah_paket);
      
      setFormMamin({ ...item, tanggal_rapat: rawDate, pagu_mamin: formatRibuan(item.pagu_mamin), pagu_bulanan: formatRibuan(item.pagu_bulanan), jumlah_paket: jPaket, is_auto: isAuto, qty_nasi: qNasi, harga_nasi: hNasi, qty_snack: qSnack, harga_snack: hSnack });
    } else if (targetSheet === 'SubKegiatan') {
      const parsedKat = parseKategori(item);
      const mappedKat = parsedKat.length > 0 ? parsedKat.map(k => ({...k, nominal: formatRibuan(k.nominal)})) : [{ nama: 'Makan Minum Rapat', nominal: '' }, { nama: 'Perjalanan Dinas', nominal: '' }];
      setFormSub({ id: item.id || '', nama_sub: item.nama_sub || '', tahun: item.tahun || selectedYear, kategori: mappedKat });
    } else if (targetSheet === 'Perdin') {
      let parsedPeserta = [{ nama: '', nominal: '' }];
      try { parsedPeserta = JSON.parse(item.rincian_peserta); } catch(e){}
      setFormPerdin({ id: item.id || '', sub_kegiatan: item.sub_kegiatan || '', tujuan: item.tujuan || '', lokasi: item.lokasi || '', peserta: parsedPeserta });
      setPerdinMode('input');
    } else if (targetSheet === 'Dynamic') {
      const catName = item.kategori_belanja;
      const selectedSub = currentSub.find(sub => sub.nama_sub === item.sub_kegiatan);
      const paguKat = selectedSub ? getPaguKategoriByName(selectedSub, catName) : 0;
      
      setFormDynamic({
        id: item.id || '',
        sub_kegiatan: item.sub_kegiatan || '',
        keterangan: item.nama_rapat || '',
        tanggal: item.tanggal_rapat ? String(item.tanggal_rapat).substring(0, 10) : '',
        nominal: formatRibuan(item.realisasi_anggaran),
        pagu: paguKat
      });
      setActiveTab(`dynamic_${catName}`);
    }
    setIsEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormMamin({ id: '', sub_kegiatan: '', kategori_belanja: 'Makan Minum Rapat', pagu_mamin: '', pagu_bulanan: '', nama_rapat: '', tanggal_rapat: '', jumlah_paket: '', is_auto: true, qty_nasi: '', harga_nasi: '', qty_snack: '', harga_snack: '' });
    setFormSub({ id: '', nama_sub: '', tahun: selectedYear === 'Semua' ? '2026' : selectedYear, kategori: [{ nama: 'Makan Minum Rapat', nominal: '' }, { nama: 'Perjalanan Dinas', nominal: '' }] });
    setFormPerdin({ id: '', sub_kegiatan: '', tujuan: '', lokasi: '', peserta: [{ nama: '', nominal: '' }] });
    setFormDynamic({ id: '', sub_kegiatan: '', keterangan: '', tanggal: '', nominal: '', pagu: 0 });
    setIsEditing(false);
  };

  const totalPaguMaminKeseluruhan = currentSub.reduce((sum, s) => sum + getPaguKategori(s, 'mamin'), 0);
  const maminEntries = currentMamin.filter(item => {
    const low = (item.kategori_belanja || 'Makan Minum Rapat').toLowerCase();
    return low.includes('makan minum') || low.includes('mamin');
  });
  const maminGrouped = {};
  maminEntries.forEach(m => {
    if (!maminGrouped[m.sub_kegiatan]) maminGrouped[m.sub_kegiatan] = [];
    maminGrouped[m.sub_kegiatan].push(m);
  });
  const totalRealisasiMaminKeseluruhan = maminEntries.reduce((sum, m) => sum + parseFloat(m.realisasi_anggaran), 0);
  const sisaMaminKeseluruhan = totalPaguMaminKeseluruhan - totalRealisasiMaminKeseluruhan;

  const totalPaguPerdinKeseluruhan = currentSub.reduce((sum, s) => sum + getPaguKategori(s, 'perdin'), 0);
  const totalRealisasiPerdinKeseluruhan = currentPerdin.filter(isRealized).reduce((sum, p) => sum + getPerdinTotal(p), 0);
  const sisaPerdinKeseluruhan = totalPaguPerdinKeseluruhan - totalRealisasiPerdinKeseluruhan;

  const totalPaguMasterKeseluruhan = currentSub.reduce((sum, s) => {
    return sum + parseKategori(s).reduce((catSum, k) => catSum + parseRibuan(k.nominal), 0);
  }, 0);

  const totalRealisasiMasterKeseluruhan = totalRealisasiMaminKeseluruhan + totalRealisasiPerdinKeseluruhan + currentMamin.filter(item => {
    const low = (item.kategori_belanja || 'Makan Minum Rapat').toLowerCase();
    return !low.includes('makan minum') && !low.includes('mamin') && !low.includes('perjalanan dinas') && !low.includes('perdin');
  }).reduce((sum, m) => sum + parseFloat(m.realisasi_anggaran), 0);

  const totalSisaMasterKeseluruhan = totalPaguMasterKeseluruhan - totalRealisasiMasterKeseluruhan;

  const dashboardAlerts = [];
  if (activeTab === 'dashboard') {
    currentSub.forEach(sub => {
      parseKategori(sub).forEach(kategori => {
        const pagu = parseRibuan(kategori.nominal);
        if (pagu <= 0) return;
        
        const isPerdin = (kategori.nama || '').toLowerCase().includes('perjalanan dinas') || (kategori.nama || '').toLowerCase().includes('perdin');
        const realisasi = isPerdin 
          ? currentPerdin.filter(item => item.sub_kegiatan === sub.nama_sub).filter(isRealized).reduce((sum, item) => sum + getPerdinTotal(item), 0)
          : currentMamin.filter(item => item.sub_kegiatan === sub.nama_sub && (item.kategori_belanja || 'Makan Minum Rapat') === kategori.nama).reduce((sum, item) => sum + (parseFloat(item.realisasi_anggaran) || 0), 0);
        
        const sisa = pagu - realisasi;
        const percentUsed = (realisasi / pagu) * 100;
        
        if (percentUsed >= 80) {
           dashboardAlerts.push({
             sub: sub.nama_sub,
             kategori: kategori.nama,
             percent: percentUsed,
             sisa: sisa
           });
        }
      });
    });
    dashboardAlerts.sort((a, b) => b.percent - a.percent); 
  }

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); cancelEdit(); }} 
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm group ${
        activeTab === id 
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_14px_0_rgb(59,130,246,0.39)] translate-x-1' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-700 hover:translate-x-1'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} /> 
      <span className="truncate">{label}</span>
      {activeTab === id && <ChevronRight size={16} className="ml-auto opacity-70 shrink-0" />}
    </button>
  );

  if (!isEntered) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="relative flex items-center justify-center w-64 h-64 mb-8 mt-4">
            <div className="absolute inset-0 bg-blue-200 blur-3xl opacity-30 rounded-full animate-pulse"></div>
            <div className="absolute top-2 left-2 bg-indigo-50 p-5 rounded-3xl backdrop-blur-md transform -rotate-12 border border-indigo-100 shadow-xl transition-all duration-700 hover:rotate-0 hover:-translate-y-2"><BookOpen size={64} className="text-indigo-500 drop-shadow-md" /></div>
            <div className="absolute z-10 bg-white/70 p-8 rounded-[2rem] backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] transform hover:scale-105 hover:-translate-y-2 transition-all duration-500"><Calculator size={84} className="text-blue-600 drop-shadow-lg" /></div>
            <div className="absolute bottom-2 right-2 z-20 bg-blue-50 p-4 rounded-3xl backdrop-blur-md transform rotate-12 border border-blue-100 shadow-xl transition-all duration-700 hover:rotate-45 hover:-translate-y-2"><Pencil size={44} className="text-blue-500 drop-shadow-md" /></div>
          </div>
          <button onClick={() => setIsEntered(true)} className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-[0_8px_30px_rgb(59,130,246,0.3)] transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 mt-4">
            Masuk <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes animSlideLeft { 0% { opacity: 0; transform: translateX(-40px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes animSlideRight { 0% { opacity: 0; transform: translateX(40px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes animSlideUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes animFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        
        .anim-sidebar { animation: animSlideLeft 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-top { animation: animFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-fade-up { animation: animSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-fade-right { animation: animSlideRight 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-x-hidden text-slate-800">
        
        <div className="md:hidden bg-white/80 backdrop-blur-md p-4 shadow-sm flex items-center justify-between z-50 sticky top-0 anim-top border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-800 font-extrabold text-lg tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <Briefcase size={16} />
            </div>
            Monitoring Anggaran
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white/90 backdrop-blur-xl md:bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-100 z-40 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col anim-sidebar`}>
          <div className="p-6 border-b border-slate-100/50 flex items-center gap-3 mt-14 md:mt-0">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]">
              <Briefcase size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 tracking-tight text-lg leading-tight">Monitoring<br/>Anggaran</h1>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Bidang Aptika</p>
            </div>
          </div>
          
          <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <div className="px-2 mb-8 mt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                <Calendar size={12}/> Tahun Anggaran
              </label>
              <div className="relative group">
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full p-3 text-sm bg-slate-50 text-indigo-700 font-bold border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-all hover:bg-slate-100">
                  <option value="Semua">Semua Tahun</option>
                  {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-500 group-hover:text-indigo-600 transition-colors"><ChevronDown size={16}/></div>
              </div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Menu Utama</p>
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="mamin" icon={Utensils} label="Makan Minum" />
            <NavItem id="perdin" icon={Plane} label="Perjalanan Dinas" />
            
            {dynamicCategories.length > 0 && <div className="pt-2"></div>}
            {dynamicCategories.map(cat => (
              <NavItem key={cat} id={`dynamic_${cat}`} icon={getCategoryIcon(cat)} label={cat} />
            ))}

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8 px-2">Pengaturan</p>
            <NavItem id="master_sub" icon={Layers} label="Data Sub Kegiatan" />
          </div>

          <div className="p-4 border-t border-slate-100/50 mt-auto bg-slate-50/50">
            <button onClick={() => setIsEntered(false)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold group border border-transparent hover:border-red-100">
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> <span>Keluar</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto">
          
          <div className="mb-8 md:mb-10 anim-fade-up">
            <h2 className="text-3xl font-extrabold text-slate-800 capitalize flex items-center gap-3 tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard Ringkasan'}
              {activeTab === 'mamin' && 'Makan Minum Rapat'}
              {activeTab === 'perdin' && 'Perjalanan Dinas'}
              {activeTab === 'master_sub' && 'Master Data Sub Kegiatan'}
              {activeTab.startsWith('dynamic_') && activeTab.replace('dynamic_', '')}
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Menampilkan rekapan untuk tahun anggaran <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{selectedYear}</span></p>
          </div>

          {/* ================= TAB: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10 anim-fade-up">
              
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50 rounded-full blur-2xl opacity-60"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                   <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Wallet size={28} /></div>
                   <div>
                      <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Total Pagu Keseluruhan</h3>
                      <p className="text-3xl font-black text-slate-800 mt-1"><AnimatedNominal value={totalPaguMasterKeseluruhan} /></p>
                   </div>
                </div>

                <div className="relative z-10 flex flex-row gap-6 w-full md:w-auto">
                   <div className="bg-emerald-50/80 border border-emerald-100 px-5 py-4 rounded-2xl flex-1 md:flex-none">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-1"><TrendingUp size={12}/> Terealisasi</div>
                      <div className="text-lg md:text-xl font-black text-emerald-700"><AnimatedNominal value={totalRealisasiMasterKeseluruhan} /></div>
                   </div>
                   <div className="bg-blue-50/80 border border-blue-100 px-5 py-4 rounded-2xl flex-1 md:flex-none">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Briefcase size={12}/> Sisa Anggaran</div>
                      <div className="text-lg md:text-xl font-black text-blue-700"><AnimatedNominal value={totalSisaMasterKeseluruhan} /></div>
                   </div>
                </div>
              </div>

              {dashboardAlerts.length > 0 && (
                <div className="bg-red-50/80 border border-red-100 rounded-3xl p-6 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-200/50 rounded-full blur-3xl"></div>
                  <h3 className="font-black text-red-700 text-lg mb-4 flex items-center gap-2 relative z-10">
                    <AlertTriangle size={22} strokeWidth={2.5} className="animate-pulse"/> Peringatan Dini Anggaran (Kritis)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {dashboardAlerts.map((alert, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 border border-red-100/50 shadow-sm flex flex-col hover:border-red-300 transition-colors">
                        <span className="font-extrabold text-slate-700 text-sm">{alert.kategori} <span className="font-medium text-xs text-slate-500">({alert.sub})</span></span>
                        <div className="flex justify-between items-end mt-2">
                           <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Terpakai: {alert.percent.toFixed(1)}%</span>
                           <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sisa: <span className="text-red-600">{formatRp(alert.sisa)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end mb-4">
                <button onClick={toggleGlobalCards} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-indigo-50 hover:border-indigo-200">
                  {showGlobalCards ? <><EyeOff size={16} strokeWidth={2.5}/> Sembunyikan Kartu Global</> : <><Eye size={16} strokeWidth={2.5}/> Tampilkan Kartu Global</>}
                </button>
              </div>

              {showGlobalCards && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-in slide-in-from-top-4 fade-in duration-500">
                  
                  <div className="bg-white rounded-3xl p-7 md:p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 flex flex-col">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors duration-500"></div>
                    <h3 className="font-extrabold text-xl text-slate-800 mb-6 flex items-center gap-3 relative z-10">
                      <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><Utensils size={24} /></div> Makan Minum (Global)
                    </h3>
                    <div className="w-full space-y-4 text-sm font-medium relative z-10 flex-1 flex flex-col">
                      <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Pagu Total Keseluruhan</span><span className="font-bold text-slate-700 text-base"><AnimatedNominal value={totalPaguMaminKeseluruhan} /></span></div>
                      <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Total Realisasi Digunakan</span><span className="font-bold text-red-500 text-base"><AnimatedNominal value={totalRealisasiMaminKeseluruhan} /></span></div>
                      <div className="flex justify-between items-center pt-2 min-w-0 mt-auto">
                        <span className="font-extrabold text-slate-700 text-base uppercase tracking-wider text-[11px] mr-2">Sisa Anggaran</span>
                        <span className={`font-black text-2xl truncate ${sisaMaminKeseluruhan < 0 ? 'text-red-500' : 'text-blue-600 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'}`} title={formatRp(sisaMaminKeseluruhan)}>
                          <AnimatedNominal value={sisaMaminKeseluruhan} />
                        </span>
                      </div>
                      <ProgressBar realisasi={totalRealisasiMaminKeseluruhan} pagu={totalPaguMaminKeseluruhan} />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-7 md:p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 flex flex-col">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600"><Plane size={24} /></div> Perjalanan Dinas (Global)
                      </h3>
                      <button onClick={() => { setIsEditingDiscount(true); setPerdinDiscountPct(savedPerdinDiscount > 0 ? savedPerdinDiscount : ''); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Pemotongan Sisa Anggaran">
                        <Scissors size={18} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="w-full text-sm font-medium relative z-10 flex flex-col flex-1">
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Pagu Total Keseluruhan</span><span className="font-bold text-slate-700 text-base"><AnimatedNominal value={totalPaguPerdinKeseluruhan} /></span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Total Realisasi Digunakan</span><span className="font-bold text-red-500 text-base"><AnimatedNominal value={totalRealisasiPerdinKeseluruhan} /></span></div>
                      </div>

                      <div className="pt-4 mt-auto min-w-0">
                        {isEditingDiscount ? (
                          <div className="flex items-center justify-between gap-2 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 animate-in fade-in zoom-in duration-200">
                             <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider ml-1">Potongan:</span>
                             <div className="flex items-center gap-1">
                               <input type="number" value={perdinDiscountPct} onChange={e => setPerdinDiscountPct(e.target.value)} className="w-16 p-1.5 text-sm font-bold text-center border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="%" />
                               <span className="text-sm font-bold text-indigo-800 mr-2">%</span>
                               <button onClick={handleSaveDiscount} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"><Check size={16} strokeWidth={3} /></button>
                               <button onClick={() => setIsEditingDiscount(false)} className="p-1.5 bg-white text-slate-600 rounded-lg hover:bg-slate-100 shadow-sm transition-colors border border-slate-200"><X size={16} strokeWidth={3} /></button>
                             </div>
                          </div>
                        ) : savedPerdinDiscount > 0 ? (
                          <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center px-1 mb-1">
                              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider line-through">Sisa Awal</span>
                              <span className="font-bold text-slate-400 text-sm line-through"><AnimatedNominal value={sisaPerdinKeseluruhan} /></span>
                            </div>
                            <div className="flex justify-between items-center bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100 shadow-sm">
                              <div className="flex flex-col">
                                 <span className="font-extrabold text-indigo-800 text-[11px] uppercase tracking-wider">Sisa Anggaran</span>
                                 <span className="text-[9px] font-bold text-indigo-500 mt-0.5 flex items-center gap-1 bg-white w-fit px-1.5 py-0.5 rounded-md border border-indigo-100"><Scissors size={10}/> Dipotong {savedPerdinDiscount}%</span>
                              </div>
                              <span className={`font-black text-2xl truncate ${sisaPerdinKeseluruhan < 0 ? 'text-red-500' : 'text-indigo-700'}`}>
                                <AnimatedNominal value={sisaPerdinKeseluruhan - (sisaPerdinKeseluruhan * (savedPerdinDiscount / 100))} />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center mt-2 animate-in fade-in duration-300">
                            <span className="font-extrabold text-slate-700 text-base uppercase tracking-wider text-[11px] mr-2">Sisa Anggaran</span>
                            <span className={`font-black text-2xl truncate ${sisaPerdinKeseluruhan < 0 ? 'text-red-500' : 'text-indigo-600 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600'}`} title={formatRp(sisaPerdinKeseluruhan)}>
                              <AnimatedNominal value={sisaPerdinKeseluruhan} />
                            </span>
                          </div>
                        )}
                        <ProgressBar realisasi={totalRealisasiPerdinKeseluruhan} pagu={totalPaguPerdinKeseluruhan} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rincian Komprehensif Sub Kegiatan</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                {currentSub.length === 0 ? (
                  <div className="col-span-full bg-white rounded-3xl p-10 text-center text-slate-400 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-medium">Belum ada Master Data Sub Kegiatan yang tercatat.</div>
                ) : (
                  currentSub.map((sub, idx) => {
                    const kategoriList = parseKategori(sub);
                    const isExpanded = expandedDashSubs.includes(sub.nama_sub);
                    
                    return (
                      <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 flex flex-col overflow-hidden group/board">
                        
                        <div onClick={() => toggleDashSub(sub.nama_sub)} className={`p-6 md:p-7 cursor-pointer transition-colors duration-500 flex items-start justify-between gap-4 ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : 'bg-white hover:bg-slate-50/50'}`}>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-lg text-slate-800 truncate leading-snug" title={sub.nama_sub}>
                              <span className="bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-md text-[10px] mr-3 font-bold uppercase tracking-widest align-middle shadow-sm">Sub</span>
                              {sub.nama_sub}
                            </h3>
                            
                            <div className={`flex flex-wrap gap-2 transition-all duration-500 ease-in-out origin-top-left ${isExpanded ? 'opacity-0 max-h-0 scale-y-0 mt-0 overflow-hidden' : 'opacity-100 max-h-20 scale-y-100 mt-3'}`}>
                              {kategoriList.map((k, i) => {
                                const IconKat = getCategoryIcon(k.nama);
                                return (
                                  <div key={i} className="flex items-center gap-1.5 bg-slate-100/80 text-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm" title={k.nama}>
                                    <IconKat size={12} strokeWidth={3} className="text-slate-400"/>
                                    <span className="text-[10px] font-bold uppercase tracking-wider max-w-[100px] truncate">{k.nama}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          
                          <div className={`p-2 rounded-xl shrink-0 transition-all duration-500 ${isExpanded ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover/board:bg-slate-200 group-hover/board:text-slate-500'}`}>
                            <ChevronDown size={20} className={`transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        <div className={`transition-[max-height,opacity,background-color] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isExpanded ? 'max-h-[3000px] opacity-100 bg-slate-50/30' : 'max-h-0 opacity-0 bg-white'}`}>
                          <div className="p-6 md:p-7 space-y-4">
                            {kategoriList.map((kategori, kIdx) => {
                              const pagu = parseRibuan(kategori.nominal);
                              const isPerdin = kategori.nama.toLowerCase().includes('perjalanan dinas') || kategori.nama.toLowerCase().includes('perdin');
                              
                              const realisasi = isPerdin 
                                ? currentPerdin
                                    .filter(item => item.sub_kegiatan === sub.nama_sub)
                                    .filter(isRealized)
                                    .reduce((sum, item) => sum + getPerdinTotal(item), 0)
                                : currentMamin
                                    .filter(item => item.sub_kegiatan === sub.nama_sub && (item.kategori_belanja || 'Makan Minum Rapat') === kategori.nama)
                                    .reduce((sum, item) => sum + (parseFloat(item.realisasi_anggaran) || 0), 0);
                              
                              const sisa = pagu - realisasi;
                              const IconKat = getCategoryIcon(kategori.nama);
                              
                              return (
                                <div key={kIdx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:border-indigo-200 transition-all duration-300 relative overflow-hidden group/item">
                                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover/item:bg-indigo-400 transition-colors duration-300"></div>
                                  <div className="pl-2">
                                    <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-3">
                                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 group-hover/item:text-indigo-500 group-hover/item:bg-indigo-50 transition-colors duration-300"><IconKat size={18} strokeWidth={2.5}/></div>
                                      <div className="text-sm font-extrabold text-slate-700 uppercase tracking-wide truncate" title={kategori.nama}>{kategori.nama}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs md:text-sm mb-1">
                                      <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Pagu</div>
                                        <div className="font-bold text-slate-700"><AnimatedNominal value={pagu} /></div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Realisasi</div>
                                        <div className="font-bold text-red-500"><AnimatedNominal value={realisasi} /></div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Sisa</div>
                                        <div className={`font-black truncate ${sisa < 0 ? 'text-red-500' : 'text-emerald-500'}`} title={formatRp(sisa)}>
                                          <AnimatedNominal value={sisa} />
                                        </div>
                                      </div>
                                    </div>
                                    <ProgressBar realisasi={realisasi} pagu={pagu} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB: MENU DINAMIS ================= */}
          {activeTab.startsWith('dynamic_') && (() => {
            const catName = activeTab.replace('dynamic_', '');
            const filteredHistory = currentMamin.filter(m => m.kategori_belanja === catName);
            const subOptions = currentSub.filter(sub => parseKategori(sub).some(k => k.nama === catName));

            let realisasiTotalDynamic = 0;
            if (formDynamic.sub_kegiatan) {
                realisasiTotalDynamic = currentMamin
                   .filter(m => m.sub_kegiatan === formDynamic.sub_kegiatan && m.kategori_belanja === catName && m.id !== formDynamic.id)
                   .reduce((sum, m) => sum + (parseFloat(m.realisasi_anggaran) || 0), 0);
            }
            const currentInputDynamic = parseRibuan(formDynamic.nominal);
            const realisasiKeseluruhan = realisasiTotalDynamic + currentInputDynamic;
            const sisaDynamic = formDynamic.pagu - realisasiKeseluruhan;
            const CatIcon = getCategoryIcon(catName);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 2xl:col-span-4 anim-fade-up">
                  <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden sticky top-6">
                    <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                      <h2 className="font-extrabold text-slate-800 flex items-center gap-3"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><CatIcon size={20} /></div> {isEditing ? 'Edit Realisasi' : 'Input Baru'}</h2>
                    </div>
                    
                    <form onSubmit={(e) => triggerSave(e, 'Dynamic')} className="p-6 md:p-8">
                      <div className="space-y-5 mb-8">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Pilih Sub Kegiatan</label>
                          <div className="relative group">
                            <select name="sub_kegiatan" value={formDynamic.sub_kegiatan || ''} onChange={handleInputDynamic} required className="w-full p-3.5 text-sm bg-slate-50 font-semibold border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer shadow-inner transition-all hover:bg-slate-100 text-slate-700">
                              <option value="" disabled>-- Pilih Sub Kegiatan --</option>
                              {subOptions.map((sub, idx) => (<option key={idx} value={sub.nama_sub}>{sub.nama_sub}</option>))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-indigo-500 transition-colors"><ChevronDown size={16}/></div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest flex justify-between">Pagu Kategori <span className="text-[10px] text-indigo-500">(Otomatis)</span></label>
                          <input type="text" value={formatRibuan(formDynamic.pagu) || ''} readOnly className="w-full p-3.5 text-sm bg-indigo-50/50 border border-indigo-100 text-indigo-800 font-bold rounded-2xl outline-none cursor-not-allowed" placeholder="Otomatis..." />
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Keterangan / Uraian</label>
                          <input type="text" name="keterangan" value={formDynamic.keterangan || ''} onChange={handleInputDynamic} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all text-slate-800" placeholder={`Cth: Pembayaran ${catName}...`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Tanggal Realisasi</label>
                            <input type="date" name="tanggal" value={formDynamic.tanggal || ''} onChange={handleInputDynamic} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all text-slate-700" />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-[11px] font-extrabold text-indigo-600 mb-2 uppercase tracking-widest">Nominal Penggunaan</label>
                            <input type="text" name="nominal" value={formDynamic.nominal || ''} onChange={handleInputDynamic} required className="w-full p-3.5 text-sm bg-white border border-indigo-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-black text-indigo-900 shadow-sm transition-all placeholder:font-normal placeholder:text-slate-300" placeholder="Ketik nominal..." />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 grid grid-cols-2 gap-4 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-400"></div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center"><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Total Realisasi</div><div className="text-base font-black text-slate-700"><AnimatedNominal value={realisasiKeseluruhan} /></div></div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center"><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Sisa Pagu</div><div className={`text-base font-black truncate ${sisaDynamic < 0 ? 'text-red-500' : 'text-emerald-500'}`} title={formatRp(sisaDynamic)}><AnimatedNominal value={sisaDynamic} /></div></div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button type="submit" disabled={loading || !formDynamic.sub_kegiatan} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(59,130,246,0.25)] hover:shadow-[0_10px_25px_rgb(59,130,246,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300"><Send size={18} /> {isEditing ? 'Simpan Perubahan' : 'Kirim Realisasi'}</button>
                        {isEditing && <button type="button" onClick={cancelEdit} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all">Batal Edit</button>}
                      </div>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-7 2xl:col-span-8 flex flex-col h-full anim-fade-right">
                  <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col h-full">
                    <div className="p-6 md:p-8 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/30">
                      <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-3"><Clock className="text-slate-400" size={22} strokeWidth={2.5}/> Riwayat Penggunaan</h3>
                      <button onClick={() => fetchData(true)} disabled={isRefreshing} className="text-indigo-600 text-xs font-extrabold uppercase tracking-wider hover:bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all border border-transparent hover:border-indigo-100">
                        <RefreshCw size={14} strokeWidth={2.5} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Memuat...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                          <tr>
                            <th className="p-5 font-bold border-b border-slate-100">Informasi & Keterangan</th>
                            <th className="p-5 text-right font-bold w-32 md:w-48 border-b border-slate-100">Nominal (Rp)</th>
                            <th className="p-5 text-center font-bold w-24 md:w-32 border-b border-slate-100">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredHistory.length === 0 ? (
                            <tr><td colSpan="3" className="text-center p-12 text-slate-400 font-medium">Belum ada riwayat {catName} tercatat.</td></tr>
                          ) : (
                            filteredHistory.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-5 align-top">
                                  <div className="font-extrabold text-slate-700 text-sm md:text-base leading-snug break-words group-hover:text-indigo-600 transition-colors">{item.nama_rapat}</div>
                                  <div className="text-xs flex flex-wrap gap-2 items-center text-slate-500 mt-2">
                                    <span className="bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold text-slate-600 whitespace-nowrap">{String(item.tanggal_rapat).substring(0, 10)}</span>
                                    <span className="leading-tight font-medium break-words text-slate-500">{item.sub_kegiatan}</span>
                                  </div>
                                </td>
                                <td className="p-5 text-right font-black text-indigo-600 text-sm md:text-base whitespace-nowrap align-top">
                                  <AnimatedNominal value={item.realisasi_anggaran} />
                                </td>
                                <td className="p-5 align-top">
                                  <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => editData(item, 'Dynamic')} className="p-2 text-yellow-600 bg-yellow-50 rounded-xl hover:bg-yellow-100 hover:shadow-sm transition-all"><Edit size={16} strokeWidth={2.5} /></button>
                                    <button onClick={() => triggerDelete(item.id, item.nama_rapat, 'Dynamic')} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 hover:shadow-sm transition-all"><Trash2 size={16} strokeWidth={2.5}/></button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================= TAB: MASTER SUB KEGIATAN ================= */}
          {activeTab === 'master_sub' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 2xl:col-span-4 anim-fade-up">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden sticky top-6">
                  <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Layers size={20} /></div> {isEditing ? 'Edit Sub Kegiatan' : 'Tambah Sub Kegiatan'}</h3>
                  </div>

                  <form onSubmit={(e) => triggerSave(e, 'SubKegiatan')} className="p-6 md:p-8">
                    <div className="space-y-5 mb-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Nama Sub Kegiatan</label>
                        <input type="text" name="nama_sub" value={formSub.nama_sub || ''} onChange={handleInputSub} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-inner transition-all text-slate-800" placeholder="Cth: Koordinasi IT Tahunan" />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Tahun Anggaran</label>
                        <div className="relative group">
                          <select name="tahun" value={formSub.tahun || selectedYear} onChange={handleInputSub} required className="w-full p-3.5 text-sm bg-slate-50 font-semibold border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none cursor-pointer shadow-inner transition-all hover:bg-slate-100 text-slate-700">
                            {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-blue-500 transition-colors"><ChevronDown size={16}/></div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 mt-6 relative">
                        <span className="absolute -top-3 left-0 bg-white px-2 text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Rincian Kategori Belanja</span>
                        
                        <div className="space-y-4">
                          {formSub.kategori.map((k, index) => (
                            <div key={index} className="flex gap-3 items-start bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-xs shrink-0 mt-2 shadow-inner">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nama Kategori</label>
                                    <input type="text" value={k.nama} required onChange={(e) => {
                                    const newKat = [...formSub.kategori];
                                    newKat[index].nama = toTitleCase(e.target.value);
                                    setFormSub({...formSub, kategori: newKat});
                                    }} className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-slate-700 font-semibold shadow-sm" placeholder="Cth: Belanja Modal..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nominal Pagu (Rp)</label>
                                    <input type="text" value={k.nominal} required onChange={(e) => {
                                    const newKat = [...formSub.kategori];
                                    newKat[index].nominal = formatRibuan(e.target.value);
                                    setFormSub({...formSub, kategori: newKat});
                                    }} className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none font-black text-indigo-700 shadow-sm" placeholder="Ketik nominal..." />
                                </div>
                              </div>
                              
                              {formSub.kategori.length > 1 && (
                                <button type="button" onClick={() => {
                                  const newKat = formSub.kategori.filter((_, i) => i !== index);
                                  setFormSub({...formSub, kategori: newKat});
                                }} className="p-3 mt-4 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all shadow-sm">
                                  <Trash2 size={16} strokeWidth={2.5}/>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button type="button" onClick={() => setFormSub({...formSub, kategori: [...formSub.kategori, {nama: '', nominal: ''}]})} className="mt-5 w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-2xl transition-colors border-2 border-indigo-100 border-dashed">
                          <PlusCircle size={18} strokeWidth={2.5}/> Tambah Kategori Belanja Lain
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                      <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(59,130,246,0.25)] hover:shadow-[0_10px_25px_rgb(59,130,246,0.35)] hover:-translate-y-0.5 transition-all duration-300">
                        <Send size={18} /> Simpan Master Data
                      </button>
                      {isEditing && <button type="button" onClick={cancelEdit} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all">Batal Edit</button>}
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-7 2xl:col-span-8 anim-fade-right">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden h-full flex flex-col">
                  <div className="p-6 md:p-8 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide">Daftar Sub Kegiatan <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg ml-2">{selectedYear}</span></h3>
                    <button onClick={() => fetchData(true)} disabled={isRefreshing} className="text-blue-500 text-xs font-extrabold uppercase tracking-wider hover:bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all border border-transparent hover:border-blue-100">
                      <RefreshCw size={14} strokeWidth={2.5} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Memuat...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="p-0 overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="p-5 font-bold border-b border-slate-100 w-1/3">Nama Sub Kegiatan</th>
                          <th className="p-5 font-bold border-b border-slate-100">Rincian Kategori Belanja</th>
                          <th className="p-5 text-center font-bold w-24 border-b border-slate-100">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentSub.length === 0 ? (
                          <tr><td colSpan="3" className="p-12 text-center text-slate-400 font-medium">Belum ada Sub Kegiatan terdaftar di tahun ini.</td></tr>
                        ) : (
                          currentSub.map((item, idx) => {
                            const paguTotalCard = parseKategori(item).reduce((sum, k) => sum + parseRibuan(k.nominal), 0);
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors group align-top">
                                <td className="p-5">
                                  <div className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">{item.nama_sub}</div>
                                  <div className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm inline-block px-2 py-1 rounded-md mt-2 uppercase tracking-widest">
                                    Tahun {item.tahun || selectedYear}
                                  </div>
                                  <div className="mt-4 pt-3 border-t border-slate-200/50">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Pagu:</div>
                                    <div className="font-black text-blue-600"><AnimatedNominal value={paguTotalCard}/></div>
                                  </div>
                                </td>
                                <td className="p-5">
                                  <div className="flex flex-col gap-2">
                                    {parseKategori(item).map((k, i) => {
                                      const KatIcon = getCategoryIcon(k.nama);
                                      return (
                                        <div key={i} className="bg-white border border-slate-200/60 shadow-sm p-2.5 rounded-xl flex items-center justify-between gap-3 group/card hover:border-indigo-200 transition-colors">
                                          <div className="flex items-center gap-2 min-w-0">
                                              <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover/card:text-indigo-500 group-hover/card:bg-indigo-50 transition-colors"><KatIcon size={14} strokeWidth={2.5}/></div>
                                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate" title={k.nama}>{k.nama}</span>
                                          </div>
                                          <span className="text-xs font-black text-indigo-700 whitespace-nowrap"><AnimatedNominal value={parseRibuan(k.nominal)} /></span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </td>
                                <td className="p-5">
                                  <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity mt-1">
                                    <button onClick={() => editData(item, 'SubKegiatan')} className="p-2 text-yellow-600 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"><Edit size={16} strokeWidth={2.5}/></button>
                                    <button onClick={() => triggerDelete(item.id, item.nama_sub, 'SubKegiatan')} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16} strokeWidth={2.5}/></button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: MAKAN MINUM RAPAT ================= */}
          {activeTab === 'mamin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 2xl:col-span-4 anim-fade-up">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden sticky top-6">
                  <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                    <h2 className="font-extrabold text-slate-800 flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Wallet size={20} /></div> {isEditing ? 'Edit Realisasi' : 'Input Rapat Baru'}</h2>
                  </div>
                  <form onSubmit={(e) => triggerSave(e, 'Sheet1')} className="p-6 md:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Pilih Sub Kegiatan</label>
                        <div className="relative group">
                          <select name="sub_kegiatan" value={formMamin.sub_kegiatan || ''} onChange={handleInputMamin} required className="w-full p-3.5 text-sm bg-slate-50 font-semibold border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none cursor-pointer shadow-inner transition-all hover:bg-slate-100 text-slate-700">
                            <option value="" disabled>-- Pilih Sub Kegiatan ({selectedYear}) --</option>
                            {currentSub.filter(s => getPaguKategori(s, 'mamin') > 0).map((sub, idx) => (<option key={idx} value={sub.nama_sub}>{sub.nama_sub}</option>))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-blue-500 transition-colors"><ChevronDown size={16}/></div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest flex justify-between">Pagu Total Mamin <span className="text-[10px] text-blue-500 font-bold">(Auto)</span></label>
                        <input type="text" name="pagu_mamin" value={formMamin.pagu_mamin || ''} readOnly className="w-full p-3.5 text-sm bg-blue-50/50 border border-blue-100 text-blue-800 font-bold rounded-2xl outline-none cursor-not-allowed" placeholder="Rp Anggaran" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest flex justify-between">Pagu Bulanan <span className="text-[10px] text-blue-500 font-bold">(Auto)</span></label>
                        <input type="text" name="pagu_bulanan" value={formMamin.pagu_bulanan || ''} readOnly className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none cursor-not-allowed font-semibold text-slate-600" placeholder="Rp Pagu Rapat" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Nama Rapat</label>
                        <input type="text" name="nama_rapat" value={formMamin.nama_rapat || ''} onChange={handleInputMamin} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner transition-all text-slate-800" placeholder="Cth: Evaluasi Server" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Tanggal Rapat</label>
                        <input type="date" name="tanggal_rapat" value={formMamin.tanggal_rapat || ''} onChange={handleInputMamin} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-inner transition-all text-slate-700" />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mt-2 shadow-sm">
                        <div>
                          <label className="block text-sm font-extrabold text-blue-900">Mode Perhitungan Harga</label>
                          <span className="text-[11px] font-medium text-blue-600">{formMamin.is_auto ? 'Otomatis: Fix Rp 61.700/paket' : 'Manual: Input Qty & Harga Sendiri'}</span>
                        </div>
                        <button type="button" onClick={() => setFormMamin({ ...formMamin, is_auto: !formMamin.is_auto })} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-inner ${formMamin.is_auto ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform drop-shadow-md ${formMamin.is_auto ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      
                      {formMamin.is_auto ? (
                        <div className="sm:col-span-2 bg-amber-50/80 p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50"></div>
                          <label className="block text-[11px] font-extrabold text-amber-800 mb-2 uppercase tracking-widest relative z-10">Jumlah Paket (Nasi + Snack)</label>
                          <input type="text" name="jumlah_paket" value={formMamin.jumlah_paket || ''} onChange={handleInputMamin} required className="w-full p-3.5 text-sm bg-white border border-amber-300 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/20 font-black text-amber-900 shadow-inner relative z-10" placeholder="Ketik jumlah peserta..." />
                        </div>
                      ) : (
                        <div className="sm:col-span-2 grid grid-cols-2 gap-4 bg-amber-50/80 p-5 rounded-2xl border border-amber-200 shadow-sm">
                          <div><label className="block text-[10px] font-extrabold text-amber-800 mb-1.5 uppercase tracking-widest">Qty Nasi</label><input type="text" name="qty_nasi" value={formMamin.qty_nasi || ''} onChange={handleInputMamin} required className="w-full p-3 text-sm bg-white border border-amber-300 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/20 font-bold shadow-inner text-amber-900" /></div>
                          <div><label className="block text-[10px] font-extrabold text-amber-800 mb-1.5 uppercase tracking-widest">Harga Nasi</label><input type="text" name="harga_nasi" value={formMamin.harga_nasi || ''} onChange={handleInputMamin} required className="w-full p-3 text-sm bg-white border border-amber-300 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/20 font-bold shadow-inner text-amber-900" /></div>
                          <div><label className="block text-[10px] font-extrabold text-amber-800 mb-1.5 uppercase tracking-widest">Qty Snack</label><input type="text" name="qty_snack" value={formMamin.qty_snack || ''} onChange={handleInputMamin} required className="w-full p-3 text-sm bg-white border border-amber-300 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/20 font-bold shadow-inner text-amber-900" /></div>
                          <div><label className="block text-[10px] font-bold text-amber-800 mb-1.5 uppercase tracking-widest">Harga Snack</label><input type="text" name="harga_snack" value={formMamin.harga_snack || ''} onChange={handleInputMamin} required className="w-full p-3 text-sm bg-white border border-amber-300 rounded-xl outline-none focus:ring-4 focus:ring-amber-500/20 font-bold shadow-inner text-amber-900" /></div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 grid grid-cols-2 gap-4 mb-8 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-400 to-indigo-400"></div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center"><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Realisasi (Inc PPN)</div><div className="text-base font-black text-blue-600"><AnimatedNominal value={realisasiAnggaranRapat} /></div></div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center"><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Total Realisasi</div><div className="text-base font-black text-amber-600"><AnimatedNominal value={realisasiTotal} /></div></div>
                      <div className="col-span-2 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 text-center min-w-0">
                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Sisa Pagu Mamin</div>
                        <div className={`text-2xl font-black truncate ${sisaMamin < 0 ? 'text-red-500' : 'text-emerald-500'}`} title={formatRp(sisaMamin)}><AnimatedNominal value={sisaMamin} /></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button type="submit" disabled={loading || !formMamin.sub_kegiatan} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(59,130,246,0.25)] hover:shadow-[0_10px_25px_rgb(59,130,246,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300"><Send size={18} /> {isEditing ? 'Simpan Perubahan' : 'Kirim Realisasi'}</button>
                      {isEditing && <button type="button" onClick={cancelEdit} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all">Batal Edit</button>}
                    </div>
                  </form>
                </div>
              </div>
              
              <div className="lg:col-span-7 2xl:col-span-8 flex flex-col h-full anim-fade-right">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col h-full">
                  <div className="p-6 md:p-8 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-3"><Clock className="text-slate-400" size={22} strokeWidth={2.5}/> Riwayat Rapat</h3>
                    <button onClick={() => fetchData(true)} disabled={isRefreshing} className="text-indigo-600 text-xs font-extrabold uppercase tracking-wider hover:bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all border border-transparent hover:border-blue-100">
                      <RefreshCw size={14} strokeWidth={2.5} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Memuat...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="p-0 overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="p-5 font-bold border-b border-slate-100">Informasi Rapat</th>
                          <th className="p-5 text-center font-bold w-20 md:w-28 border-b border-slate-100">Qty</th>
                          <th className="p-5 text-right font-bold w-28 md:w-40 border-b border-slate-100">Realisasi (Rp)</th>
                          <th className="p-5 text-center font-bold w-20 md:w-24 border-b border-slate-100">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.keys(maminGrouped).length === 0 ? (
                          <tr><td colSpan="4" className="text-center p-12 text-slate-400 font-medium">Belum ada riwayat Rapat untuk tahun {selectedYear}.</td></tr>
                        ) : (
                          Object.keys(maminGrouped).map((subName, subIdx) => {
                            const isSubExpanded = expandedMaminSub === subName;
                            const subItems = maminGrouped[subName];
                            const subTotal = subItems.reduce((acc, curr) => acc + (parseFloat(curr.realisasi_anggaran) || 0), 0);
                            const subData = currentSub.find(s => s.nama_sub === subName);
                            const subPagu = subData ? getPaguKategori(subData, 'mamin') : 0;

                            return (
                              <React.Fragment key={subIdx}>
                                <tr onClick={() => toggleMaminSub(subName)} className={`cursor-pointer transition-colors ${isSubExpanded ? 'bg-indigo-50/80' : 'bg-slate-100/60 hover:bg-slate-200/50'}`}>
                                  <td className="p-4" colSpan="4">
                                    <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-3">
                                          <div className={`p-1.5 rounded-lg transition-colors ${isSubExpanded ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                                             <ChevronDown size={16} strokeWidth={3} className={`transition-transform duration-300 ${isSubExpanded ? 'rotate-180' : ''}`} />
                                          </div>
                                          <span className={`font-extrabold text-sm md:text-base ${isSubExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>{subName}</span>
                                       </div>
                                       <div className="flex items-center gap-6">
                                          <div className="text-right hidden sm:block">
                                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pagu</div>
                                             <div className="font-bold text-slate-600"><AnimatedNominal value={subPagu} /></div>
                                          </div>
                                          <div className="text-right">
                                             <div className={`text-[10px] font-bold uppercase tracking-widest ${isSubExpanded ? 'text-indigo-400' : 'text-slate-400'}`}>Total Realisasi</div>
                                             <div className={`font-black ${isSubExpanded ? 'text-indigo-700' : 'text-blue-600'}`}><AnimatedNominal value={subTotal} /></div>
                                          </div>
                                       </div>
                                    </div>
                                  </td>
                                </tr>

                                {isSubExpanded && subItems.map((item) => {
                                  const isRowExpanded = expandedMaminRow === item.id;
                                  let detailManual = null, itemSubTotal = 0, dppn = 0;
                                  const totalRealisasi = parseFloat(item.realisasi_anggaran) || 0;

                                  if (String(item.jumlah_paket).includes('Nasi:')) {
                                    const match = String(item.jumlah_paket).match(/Nasi:\s*(\d+)\s*\(@\s*(\d+)\)\s*\|\s*Snack:\s*(\d+)\s*\(@\s*(\d+)\)/);
                                    if (match) {
                                      const qNasi = parseInt(match[1]), hNasi = parseInt(match[2]), qSnack = parseInt(match[3]), hSnack = parseInt(match[4]);
                                      itemSubTotal = (qNasi * hNasi) + (qSnack * hSnack);
                                      dppn = itemSubTotal * 0.10;
                                      detailManual = { qNasi, hNasi, totNasi: qNasi*hNasi, qSnack, hSnack, totSnack: qSnack*hSnack };
                                    }
                                  } else {
                                    itemSubTotal = parseRibuan(item.jumlah_paket) * 61700;
                                    dppn = itemSubTotal * 0.10;
                                  }

                                  return (
                                    <React.Fragment key={item.id}>
                                      <tr onClick={(e) => { e.stopPropagation(); toggleMaminRow(item.id); }} className={`cursor-pointer transition-colors group ${isRowExpanded ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50/80'}`}>
                                        <td className="p-4 pl-8 md:pl-10 align-top">
                                          <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0 group-hover:bg-blue-400 transition-colors"></div>
                                            <div className="min-w-0 flex-1">
                                              <div className="font-extrabold text-slate-700 text-sm md:text-base leading-snug break-words group-hover:text-blue-600 transition-colors">{item.nama_rapat}</div>
                                              <div className="text-xs flex flex-wrap gap-2 items-center text-slate-500 mt-2">
                                                <span className="bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold text-slate-600 whitespace-nowrap">{String(item.tanggal_rapat).substring(0, 10)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4 text-center font-black text-slate-600 align-top">
                                          {detailManual ? (
                                            <div className="text-[10px] leading-tight flex flex-col gap-1.5 items-center">
                                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">Nasi: {detailManual.qNasi}</span>
                                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">Snack: {detailManual.qSnack}</span>
                                            </div>
                                          ) : ( <span className="text-sm md:text-base bg-white border border-slate-200 shadow-sm px-3.5 py-1.5 rounded-xl whitespace-nowrap">{formatRibuan(item.jumlah_paket)}</span> )}
                                        </td>
                                        <td className="p-4 text-right font-black text-blue-600 text-sm md:text-base whitespace-nowrap align-top"><AnimatedNominal value={item.realisasi_anggaran} /></td>
                                        <td className="p-4 align-top">
                                          <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); editData(item, 'Sheet1'); }} className="p-2 text-yellow-600 bg-yellow-50 rounded-xl hover:bg-yellow-100 hover:shadow-sm transition-all"><Edit size={16} strokeWidth={2.5}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); triggerDelete(item.id, item.nama_rapat, 'Sheet1'); }} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 hover:shadow-sm transition-all"><Trash2 size={16} strokeWidth={2.5}/></button>
                                          </div>
                                        </td>
                                      </tr>
                                      {isRowExpanded && (
                                        <tr className="bg-slate-50/60 shadow-inner">
                                          <td colSpan="4" className="p-0 border-b border-slate-200">
                                            <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                              <div className="m-4 ml-10 md:ml-12 border border-slate-200/60 rounded-2xl bg-white p-5 shadow-sm">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                                  <div>
                                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Informasi Rapat</h4>
                                                    <div className="space-y-3.5 text-sm text-slate-600 font-medium">
                                                      <div className="flex justify-between items-start gap-4 border-b border-slate-50 pb-2"><span className="text-slate-400 shrink-0">Sub Kegiatan:</span> <span className="font-bold text-slate-800 text-right break-words">{item.sub_kegiatan}</span></div>
                                                      <div className="flex justify-between items-start gap-4 border-b border-slate-50 pb-2"><span className="text-slate-400 shrink-0">Nama Rapat:</span> <span className="font-bold text-slate-800 text-right break-words">{item.nama_rapat}</span></div>
                                                      <div className="flex justify-between items-start gap-4"><span className="text-slate-400 shrink-0">Tanggal:</span> <span className="font-bold text-slate-800 text-right whitespace-nowrap">{String(item.tanggal_rapat).substring(0, 10)}</span></div>
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Rincian Kalkulasi</h4>
                                                    <div className="space-y-3 text-sm text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                      {detailManual ? (
                                                        <>
                                                          <div className="flex justify-between"><span className="text-slate-500 shrink-0 mr-2">{detailManual.qNasi} Nasi (@ {formatRibuan(detailManual.hNasi)})</span> <span className="font-bold text-slate-800 whitespace-nowrap"><AnimatedNominal value={detailManual.totNasi} /></span></div>
                                                          <div className="flex justify-between"><span className="text-slate-500 shrink-0 mr-2">{detailManual.qSnack} Snack (@ {formatRibuan(detailManual.hSnack)})</span> <span className="font-bold text-slate-800 whitespace-nowrap"><AnimatedNominal value={detailManual.totSnack} /></span></div>
                                                        </>
                                                      ) : ( <div className="flex justify-between"><span className="text-slate-500 shrink-0 mr-2">{formatRibuan(item.jumlah_paket)} Paket (Nasi+Snack)</span> <span className="font-bold text-slate-800 whitespace-nowrap"><AnimatedNominal value={itemSubTotal} /></span></div> )}
                                                      <div className="flex justify-between pt-3 border-t border-slate-200/60"><span className="text-slate-500">Subtotal Harga Nego:</span> <span className="font-bold text-slate-800 whitespace-nowrap"><AnimatedNominal value={itemSubTotal} /></span></div>
                                                      <div className="flex justify-between"><span className="text-slate-500">PPN (10%):</span> <span className="font-bold text-slate-800 whitespace-nowrap"><AnimatedNominal value={dppn} /></span></div>
                                                      <div className="flex justify-between pt-3 mt-1 border-t border-slate-200 min-w-0"><span className="font-black text-blue-900 tracking-wide truncate">Total Realisasi:</span> <span className="font-black text-blue-600 text-lg truncate" title={formatRp(totalRealisasi)}><AnimatedNominal value={totalRealisasi} /></span></div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: PERJALANAN DINAS ================= */}
          {activeTab === 'perdin' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-5 2xl:col-span-4 anim-fade-up">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden sticky top-6">
                  
                  <div className="p-5 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                     <div className="flex w-full bg-slate-200/50 p-1 rounded-xl">
                       <button type="button" onClick={() => setPerdinMode('input')} className={`flex-1 px-4 py-2.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all ${perdinMode === 'input' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Input Realisasi</button>
                       <button type="button" onClick={() => setPerdinMode('predict')} className={`flex-1 px-4 py-2.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all ${perdinMode === 'predict' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Rencana Draft</button>
                     </div>
                  </div>
                  
                  {perdinMode === 'input' ? (
                    <form onSubmit={(e) => triggerSave(e, 'Perdin')} className="p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
                      <div className="space-y-5 mb-6">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Pilih Sub Kegiatan</label>
                          <div className="relative group">
                            <select name="sub_kegiatan" value={formPerdin.sub_kegiatan || ''} onChange={(e) => { handleInputPerdin(e); setCurrentPagePerdin(1); }} required className="w-full p-3.5 text-sm bg-slate-50 font-semibold border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer shadow-inner transition-all hover:bg-slate-100 text-slate-700">
                              <option value="" disabled>-- Pilih Sub Kegiatan ({selectedYear}) --</option>
                              {currentSub.filter(s => getPaguKategori(s, 'perdin') > 0).map((sub, idx) => (<option key={idx} value={sub.nama_sub}>{sub.nama_sub}</option>))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-indigo-500 transition-colors"><ChevronRight className="rotate-90" size={16}/></div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Tujuan Perjalanan Dinas</label>
                          <input type="text" name="tujuan" value={formPerdin.tujuan || ''} onChange={handleInputPerdin} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all text-slate-800" placeholder="Cth: Koordinasi Aplikasi" />
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">Lokasi Tujuan</label>
                          <input type="text" name="lokasi" value={formPerdin.lokasi || ''} onChange={handleInputPerdin} required className="w-full p-3.5 text-sm bg-slate-50 font-medium border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all text-slate-800" placeholder="Cth: Jakarta Selatan" />
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6 relative">
                          <span className="absolute -top-3 left-0 bg-white px-2 text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Daftar Anggota & Nominal</span>
                          
                          <div className="space-y-4 pt-2">
                            {formPerdin.peserta.map((p, index) => (
                              <div key={index} className="flex gap-3 items-start sm:items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                                
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs shrink-0 mt-1 sm:mt-0 shadow-sm border border-indigo-200/50">
                                  {index + 1}
                                </div>

                                <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
                                  <input type="text" value={p.nama} onChange={(e) => handlePesertaChange(index, 'nama', e.target.value)} required className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700 font-semibold shadow-sm" placeholder="Nama..." />
                                  <input type="text" value={p.nominal} onChange={(e) => handlePesertaChange(index, 'nominal', e.target.value)} required className="w-full p-3 text-sm bg-white border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none font-black text-indigo-700 shadow-sm" placeholder="Nominal Rp..." />
                                </div>
                                {formPerdin.peserta.length > 1 && (
                                  <button type="button" onClick={() => removePeserta(index)} className="p-3 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all shadow-sm mt-1 sm:mt-0">
                                    <Trash2 size={18} strokeWidth={2.5}/>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button type="button" onClick={addPeserta} className="mt-5 w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-2xl transition-colors border-2 border-indigo-100 border-dashed">
                            <PlusCircle size={18} strokeWidth={2.5}/> Tambah Anggota Perdin
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 mb-8 flex justify-between items-center min-w-0 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-purple-400"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mr-2">Total Realisasi (Rp)</span>
                        <span className="text-2xl font-black text-indigo-600 truncate" title={formatRp(currentTotalPerdin)}><AnimatedNominal value={currentTotalPerdin} /></span>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(59,130,246,0.25)] hover:shadow-[0_10px_25px_rgb(59,130,246,0.35)] hover:-translate-y-0.5 transition-all duration-300">
                          <Send size={18} /> {isEditing ? 'Simpan Perubahan' : 'Kirim Realisasi Perdin'}
                        </button>
                        {isEditing && (
                          <button type="button" onClick={cancelEdit} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all">Batal Edit</button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
                      <div className="space-y-5 mb-6">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">1. Pilih Sub Kegiatan</label>
                          <div className="relative group">
                            <select name="sub_kegiatan" value={predictForm.sub_kegiatan} onChange={(e) => {
                                setPredictForm({ ...predictForm, sub_kegiatan: e.target.value });
                                setDraftCart([]); 
                            }} className="w-full p-3.5 text-sm bg-slate-50 font-semibold border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer shadow-inner transition-all text-slate-700">
                              <option value="" disabled>-- Pilih Sub Kegiatan --</option>
                              {currentSub.filter(s => getPaguKategori(s, 'perdin') > 0).map((sub, idx) => (<option key={idx} value={sub.nama_sub}>{sub.nama_sub}</option>))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-indigo-500 transition-colors"><ChevronDown size={16}/></div>
                          </div>
                        </div>

                        {predictForm.sub_kegiatan && (
                          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            
                            <div className="flex justify-between items-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-6">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-800 flex items-center gap-1.5"><Wallet size={14}/> Sisa Anggaran Tersedia</span>
                              <span className="text-lg font-black text-indigo-700"><AnimatedNominal value={sisaAnggaranPredict} /></span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                              <div className="lg:col-span-1">
                                <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">2. Tujuan / Lokasi</label>
                                <div className="relative">
                                  <select name="lokasi" value={predictForm.lokasi} onChange={(e) => {
                                      const loc = e.target.value;
                                      const locData = suggestionList.find(s => s.lokasi === loc);
                                      setPredictForm({ 
                                         ...predictForm, 
                                         lokasi: loc, 
                                         estimasi_biaya: locData ? formatRibuan(locData.avgCost) : '' 
                                      });
                                  }} className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all appearance-none">
                                     <option value="">Pilih dari Riwayat...</option>
                                     {suggestionList.map((s, idx) => <option key={idx} value={s.lokasi}>{s.lokasi}</option>)}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><ChevronDown size={14}/></div>
                                </div>
                                <input type="text" placeholder="Atau ketik manual..." value={predictForm.lokasi} onChange={(e) => setPredictForm({...predictForm, lokasi: e.target.value})} className="w-full mt-2 p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 shadow-sm" />
                              </div>
                              
                              <div className="lg:col-span-1">
                                <label className="block text-[11px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">3. Estimasi Biaya (Rp)</label>
                                <input type="text" name="estimasi_biaya" value={predictForm.estimasi_biaya} onChange={(e) => setPredictForm({...predictForm, estimasi_biaya: formatRibuan(e.target.value)})} className="w-full p-3.5 text-sm bg-white border border-amber-300 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/20 shadow-sm transition-all font-black text-amber-900" placeholder="Ketik nominal..." />
                              </div>

                              <div className="lg:col-span-1 flex items-end">
                                <button type="button" onClick={addToCart} disabled={!predictForm.lokasi || !predictForm.estimasi_biaya} className="w-full p-3.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                  <PlusCircle size={18}/> Tambah ke Rencana
                                </button>
                              </div>
                            </div>

                            {draftCart.length > 0 && (
                              <div className="mb-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                                 <div className="p-3 bg-slate-100/50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest">Daftar Rencana Perjalanan</div>
                                 <div className="p-2 space-y-2">
                                   {draftCart.map((item, idx) => (
                                     <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                       <div className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                         <span className="font-bold text-slate-700 text-sm">{item.lokasi}</span>
                                       </div>
                                       <div className="flex items-center gap-4">
                                         <span className="font-black text-indigo-600">{formatRp(item.biaya)}</span>
                                         <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500"><XCircle size={18}/></button>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                            )}

                            {(draftCart.length > 0) && (
                              <div className={`p-5 rounded-3xl border relative overflow-hidden animate-in fade-in duration-500 ${isPredictSafe ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                 <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40 ${isPredictSafe ? 'bg-emerald-200' : 'bg-red-200'}`}></div>
                                 <div className="relative z-10 flex items-start gap-4">
                                   <div className={`p-3 rounded-2xl text-white ${isPredictSafe ? 'bg-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_4px_15px_rgba(239,68,68,0.3)]'}`}>
                                     {isPredictSafe ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <h4 className={`text-xs md:text-sm font-black uppercase tracking-wider mb-1 ${isPredictSafe ? 'text-emerald-800' : 'text-red-800'}`}>
                                       {isPredictSafe ? 'STATUS AMAN' : 'DANA TIDAK MENCUKUPI'}
                                     </h4>
                                     <p className={`text-[11px] md:text-xs font-semibold mb-3 ${isPredictSafe ? 'text-emerald-600' : 'text-red-600'}`}>
                                       {isPredictSafe 
                                         ? `Total rencana perjalanan sebesar ${formatRp(totalDraftCost)} masih dalam batas anggaran.` 
                                         : `Anggaran Anda kurang ${formatRp(Math.abs(sisaSetelahPredict))} untuk seluruh rencana ini.`}
                                     </p>
                                     <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/50 flex justify-between items-center">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sisa Anggaran Akhir:</span>
                                       <span className={`text-base md:text-lg font-black truncate ${isPredictSafe ? 'text-emerald-700' : 'text-red-600'}`} title={formatRp(isPredictSafe ? sisaSetelahPredict : 0)}>
                                          <AnimatedNominal value={isPredictSafe ? sisaSetelahPredict : 0} />
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="lg:col-span-7 2xl:col-span-8 flex flex-col gap-6 anim-fade-right">
                
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100/70">
                    <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-3"><Filter className="text-indigo-500" size={22} strokeWidth={2.5}/> Rekap Anggaran Perdin</h3>
                    <div className="relative min-w-[220px] group">
                      <select value={filterPerdin} onChange={(e) => { setFilterPerdin(e.target.value); setCurrentPagePerdin(1); }} className="w-full p-3 text-sm bg-slate-50 text-indigo-700 font-bold border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-all hover:bg-slate-100 shadow-inner">
                        <option value="Semua">Tampilkan Semua Kegiatan</option>
                        {currentSub.map((sub, idx) => (<option key={idx} value={sub.nama_sub}>{sub.nama_sub}</option>))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-500 group-hover:text-indigo-600 transition-colors"><ChevronDown size={16}/></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 truncate">Pagu {filterPerdin !== 'Semua' ? 'Sub' : 'Total'}</div>
                      <div className="text-base sm:text-lg lg:text-base xl:text-lg font-black text-slate-700 truncate" title={formatRp(currentPaguPerdinSummary)}><AnimatedNominal value={currentPaguPerdinSummary} /></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 truncate">Terealisasi</div>
                      <div className="text-base sm:text-lg lg:text-base xl:text-lg font-black text-red-500 truncate" title={formatRp(historyPerdinSum)}><AnimatedNominal value={historyPerdinSum} /></div>
                    </div>
                    <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 text-center min-w-0 flex flex-col justify-center relative overflow-hidden">
                      {savedPerdinDiscount > 0 && <div className="absolute -right-2 -top-2 w-16 h-16 bg-indigo-200 rounded-full blur-xl opacity-50"></div>}
                      <div className="text-[10px] text-indigo-800 font-black uppercase tracking-widest mb-1 truncate relative z-10">Sisa Anggaran</div>
                      
                      {savedPerdinDiscount > 0 ? (
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="text-xs font-bold text-slate-400 line-through mb-0.5" title={formatRp(sisaPerdinSummary)}>
                            <AnimatedNominal value={sisaPerdinSummary} />
                          </div>
                          <div className={`text-base sm:text-lg lg:text-base xl:text-lg font-black truncate flex items-center justify-center gap-1.5 ${sisaPerdinSummary < 0 ? 'text-red-500' : 'text-indigo-700'}`} title={formatRp(sisaPerdinSummary - (sisaPerdinSummary * (savedPerdinDiscount / 100)))}>
                            <AnimatedNominal value={sisaPerdinSummary - (sisaPerdinSummary * (savedPerdinDiscount / 100))} />
                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-600 text-white rounded-md flex items-center gap-0.5"><Scissors size={8} strokeWidth={3}/> {savedPerdinDiscount}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`text-base sm:text-lg lg:text-base xl:text-lg font-black truncate relative z-10 ${sisaPerdinSummary < 0 ? 'text-red-500' : 'text-indigo-700'}`} title={formatRp(sisaPerdinSummary)}>
                          <AnimatedNominal value={sisaPerdinSummary} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex-1 flex flex-col">
                  <div className="p-6 md:p-8 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-3"><Clock className="text-slate-400" size={22} strokeWidth={2.5}/> Riwayat Perjalanan</h3>
                    <button onClick={() => fetchData(true)} disabled={isRefreshing} className="text-indigo-600 text-xs font-extrabold uppercase tracking-wider hover:bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all border border-transparent hover:border-indigo-100">
                      <RefreshCw size={14} strokeWidth={2.5} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Memuat...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="p-0 overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="p-5 font-bold border-b border-slate-100">Informasi & Lokasi</th>
                          <th className="p-5 font-bold w-64 border-b border-slate-100">Rincian Anggota</th>
                          <th className="p-5 text-right font-bold w-36 border-b border-slate-100">Total (Rp)</th>
                          <th className="p-5 text-center font-bold w-32 border-b border-slate-100">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedPerdinData.length === 0 ? (
                          <tr><td colSpan="4" className="text-center p-12 text-slate-400 font-medium">Belum ada riwayat Perdin untuk filter ini di tahun {selectedYear}.</td></tr>
                        ) : (
                          paginatedPerdinData.map((item, index) => {
                            let parsedPeserta = [];
                            try { parsedPeserta = JSON.parse(item.rincian_peserta); } catch(e){}
                            
                            const totalNominalReal = getPerdinTotal(item);

                            return (
                              <tr key={index} className="hover:bg-slate-50/80 transition-colors align-top group">
                                <td className="p-5 min-w-[200px]">
                                  <div className="font-extrabold text-slate-700 text-sm md:text-base leading-snug break-words group-hover:text-indigo-600 transition-colors">{item.lokasi}</div>
                                  {item.tujuan && <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5 leading-snug break-words">{item.tujuan}</div>}
                                  <div className="text-xs flex flex-wrap gap-2 items-center text-slate-500 mt-2.5">
                                    <span className="bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold text-slate-600 whitespace-nowrap">{String(item.timestamp).substring(0, 10)}</span>
                                    <span className="leading-tight font-medium break-words">{item.sub_kegiatan}</span>
                                  </div>
                                </td>
                                <td className="p-5">
                                  <div className="flex flex-col gap-2">
                                    {parsedPeserta.map((p, i) => (
                                      <div key={i} className="flex justify-between items-center text-xs bg-white border border-slate-200 shadow-sm text-slate-600 px-3 py-2 rounded-xl group/peserta hover:border-indigo-200 transition-colors">
                                        <span className="font-bold break-words leading-tight mr-2 group-hover/peserta:text-indigo-600 transition-colors" title={p.nama}>{p.nama}</span>
                                        <span className="font-black text-slate-800 whitespace-nowrap">{p.nominal}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className={`p-5 text-right font-black text-sm md:text-base whitespace-nowrap align-top ${isRealized(item) ? 'text-indigo-600' : 'text-slate-400 line-through'}`} title={formatRp(totalNominalReal)}>
                                  <AnimatedNominal value={totalNominalReal} />
                                </td>
                                <td className="p-5 align-top">
                                  <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => toggleRealisasiPerdin(item)} 
                                      title={isRealized(item) ? "Batalkan Realisasi" : "Tandai Terealisasi"}
                                      className={`p-2 rounded-xl hover:shadow-sm transition-all ${isRealized(item) ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                    >
                                      {isRealized(item) ? <CheckCircle size={16} strokeWidth={2.5}/> : <ToggleLeft size={16} strokeWidth={2.5}/>}
                                    </button>
                                    <button onClick={() => editData(item, 'Perdin')} className="p-2 text-yellow-600 bg-yellow-50 rounded-xl hover:bg-yellow-100 hover:shadow-sm transition-all"><Edit size={16} strokeWidth={2.5}/></button>
                                    <button onClick={() => triggerDelete(item.id, item.lokasi, 'Perdin')} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 hover:shadow-sm transition-all"><Trash2 size={16} strokeWidth={2.5}/></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {totalPagesPerdin > 1 && (
                    <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Menampilkan {((currentPagePerdin - 1) * itemsPerPage) + 1} - {Math.min(currentPagePerdin * itemsPerPage, filteredPerdinData.length)} dari total {filteredPerdinData.length} data
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPagePerdin(prev => Math.max(prev - 1, 1))}
                          disabled={currentPagePerdin === 1}
                          className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          Sebelumnya
                        </button>
                        <div className="flex items-center gap-1 mx-2 hidden md:flex">
                          {[...Array(totalPagesPerdin)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPagePerdin(i + 1)}
                              className={`w-8 h-8 rounded-xl text-xs font-black transition-all shadow-sm ${currentPagePerdin === i + 1 ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-slate-500 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPagePerdin(prev => Math.min(prev + 1, totalPagesPerdin))}
                          disabled={currentPagePerdin === totalPagesPerdin}
                          className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* --- MODAL KONFIRMASI (YES/NO) --- */}
        {dialog.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform scale-100 transition-transform">
              <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl shadow-sm ${dialog.type === 'delete' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                <AlertCircle size={32} strokeWidth={2.5}/>
              </div>
              <h3 className="text-xl font-extrabold text-center text-slate-800 mb-3">{dialog.title}</h3>
              <p className="text-center text-slate-500 mb-8 leading-relaxed font-medium">{dialog.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setDialog({ ...dialog, isOpen: false })} className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={executeAction} className={`flex-1 px-4 py-3.5 font-bold rounded-2xl text-white transition-all shadow-md ${dialog.type === 'delete' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>Ya, Lanjutkan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}