import React, { useState, useEffect } from 'react';
import { User, CropSale, MachineryRental, LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/languages';
import { ShoppingBag, Plus, Search, MapPin, Phone, Trash2, Camera, Tag, Tractor } from 'lucide-react';

interface CropMarketplaceProps {
  user: User | null;
  lang: LanguageCode;
  isPublicView?: boolean;
}

export const CropMarketplace: React.FC<CropMarketplaceProps> = ({ user, lang, isPublicView = false }) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'crops' | 'rentals'>('crops');
  const [sales, setSales] = useState<CropSale[]>([]);
  const [rentals, setRentals] = useState<MachineryRental[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State
  const [showAddCropModal, setShowAddCropModal] = useState<boolean>(false);
  const [showAddRentalModal, setShowAddRentalModal] = useState<boolean>(false);

  // Form Crop State
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cropPrice, setCropPrice] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [cropAddress, setCropAddress] = useState(user?.village || user?.taluk || '');
  
  // Form Rental State
  const [machineName, setMachineName] = useState('');
  const [description, setDescription] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'crops') loadSales();
    else loadRentals();
  }, [activeTab, searchQuery]);

  const loadSales = async () => {
    try {
      const res = await fetch('/api/crop/sales');
      const data = await res.json();
      if (Array.isArray(data)) {
        let filtered = data;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = data.filter(
            (s) =>
              (s.crop_name && s.crop_name.toLowerCase().includes(q)) ||
              (s.quantity && s.quantity.toLowerCase().includes(q)) ||
              (s.farmer_name && s.farmer_name.toLowerCase().includes(q))
          );
        }
        setSales(filtered);
      }
    } catch (err) {
      console.error('Failed to load sales', err);
    }
  };

  const loadRentals = async () => {
    try {
      const res = await fetch('/api/machinery/rentals');
      const data = await res.json();
      if (Array.isArray(data)) {
        let filtered = data;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = data.filter(
            (r) =>
              (r.machine_name && r.machine_name.toLowerCase().includes(q)) ||
              (r.description && r.description.toLowerCase().includes(q)) ||
              (r.owner_name && r.owner_name.toLowerCase().includes(q))
          );
        }
        setRentals(filtered);
      }
    } catch (err) {
      console.error('Failed to load rentals', err);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cropName || !quantity || !cropPrice) {
      alert('Please fill crop name, quantity and price');
      return;
    }
    setLoading(true);

    let imageUrl = '';
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) imageUrl = uploadData.url;
      } catch (err) {
        console.error('Upload error', err);
      }
    }

    try {
      const res = await fetch('/api/crop/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: user.id,
          crop_name: cropName,
          quantity,
          price: cropPrice,
          image_url: imageUrl,
          contact_phone: contactPhone || user.phone,
          address: cropAddress || user.taluk || '',
          taluk: user.taluk || 'Karnataka'
        })
      });
      if (res.ok) {
        setCropName('');
        setQuantity('');
        setCropPrice('');
        setImageFile(null);
        setShowAddCropModal(false);
        loadSales();
      }
    } catch (err) {
      alert('Failed to post crop sale');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !machineName || !rentalPrice) {
      alert('Please fill machine name and rental price');
      return;
    }
    setLoading(true);

    let imageUrl = '';
    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) imageUrl = uploadData.url;
      } catch (err) {
        console.error('Upload error', err);
      }
    }

    try {
      const res = await fetch('/api/machinery/rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: user.id,
          machine_name: machineName,
          description,
          rental_price: rentalPrice,
          image_url: imageUrl,
          contact_phone: contactPhone || user.phone,
          address: cropAddress || user.taluk || '',
          taluk: user.taluk || 'Karnataka'
        })
      });
      if (res.ok) {
        setMachineName('');
        setDescription('');
        setRentalPrice('');
        setImageFile(null);
        setShowAddRentalModal(false);
        loadRentals();
      }
    } catch (err) {
      alert('Failed to post rental listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId: number | string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this crop sale listing?')) return;
    try {
      const res = await fetch(`/api/crop/sale/${saleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: user.id })
      });
      if (res.ok) {
        setSales((prev) => prev.filter((s) => String(s.id) !== String(saleId)));
      }
    } catch (err) {
      console.error('Failed to delete sale', err);
    }
  };

  const handleDeleteRental = async (rentalId: number | string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this machinery rental listing?')) return;
    try {
      const res = await fetch(`/api/machinery/rental/${rentalId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: user.id })
      });
      if (res.ok) {
        setRentals((prev) => prev.filter((r) => String(r.id) !== String(rentalId)));
      }
    } catch (err) {
      console.error('Failed to delete rental', err);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <span>{isPublicView ? t.publicMarket : t.mySales}</span>
          </h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            Direct Farmer Crop Marketplace & Machinery Rentals
          </p>
        </div>

        {!isPublicView && user && (
          <div className="flex gap-2">
            {activeTab === 'crops' ? (
              <button
                onClick={() => setShowAddCropModal(true)}
                className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-2xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addSale}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddRentalModal(true)}
                className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-2xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t.postRental}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Subpage Navigation Tabs (Crops vs Rentals) */}
      <div className="flex bg-slate-200 p-1 rounded-2xl text-xs font-bold shadow-inner">
        <button
          onClick={() => setActiveTab('crops')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'crops' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-300" />
          <span>1. {t.mySales} (Crops for Sale)</span>
        </button>
        <button
          onClick={() => setActiveTab('rentals')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition ${
            activeTab === 'rentals' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Tractor className="w-4 h-4" />
          <span>2. {t.rentals} (Machinery Subpage)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'crops' ? 'Search crops (Groundnut, 50 quintal)...' : 'Search machinery (Tractor, Harvester)...'}
          className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600 shadow-2xs"
        />
      </div>

      {/* Content List */}
      {activeTab === 'crops' ? (
        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border border-amber-100 shadow-xs font-medium">
              No crop sales listed currently. {user ? 'Click "+ List Crop Sale" to create a post!' : ''}
            </div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs flex gap-3 items-center relative hover:border-emerald-300 transition"
              >
                {sale.image_url ? (
                  <img
                    src={sale.image_url}
                    alt="Crop"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                    🌾
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      {sale.crop_name} ({sale.quantity})
                    </h3>
                    {!isPublicView && user && String(sale.farmer_id) === String(user.id) && (
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                        title="Delete my crop listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Price: {sale.price}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-normal">{sale.farmer_name || 'Farmer'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{sale.address || sale.taluk || 'Karnataka'}</span>
                  </div>
                  <a
                    href={`tel:${sale.contact_phone || sale.farmer_phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call: {sale.contact_phone || sale.farmer_phone || 'Contact Seller'}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border border-amber-100 shadow-xs font-medium">
              No machinery rentals available currently. {user ? 'Click "+ Post Rental" to add machine!' : ''}
            </div>
          ) : (
            rentals.map((rental) => (
              <div
                key={rental.id}
                className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs flex gap-3 items-center relative hover:border-amber-300 transition"
              >
                {rental.image_url ? (
                  <img
                    src={rental.image_url}
                    alt="Machinery"
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                    🚜
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{rental.machine_name}</h3>
                    {!isPublicView && user && String(rental.owner_id) === String(user.id) && (
                      <button
                        onClick={() => handleDeleteRental(rental.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                        title="Delete my machinery rental listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{rental.description || 'Farm equipment'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rate: {rental.rental_price}</span>
                  </div>
                  <a
                    href={`tel:${rental.contact_phone || rental.owner_phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contact Owner: {rental.contact_phone || rental.owner_phone || 'Call'}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Crop Modal */}
      {showAddCropModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-200 space-y-3">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              ➕ {t.addSale}
            </h3>
            <form onSubmit={handleAddSale} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Crop Name</label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Groundnut (मूंगफली / ಕಡಲೆಕಾಯಿ)"
                  required
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50 Quintals"
                    required
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Asking Price</label>
                  <input
                    type="text"
                    value={cropPrice}
                    onChange={(e) => setCropPrice(e.target.value)}
                    placeholder="e.g. ₹5,200/quintal"
                    required
                    className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Attach Crop Photo</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCropModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs"
                >
                  {loading ? 'Posting...' : 'Post Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rental Modal */}
      {showAddRentalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-200 space-y-3">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              🚜 {t.postRental}
            </h3>
            <form onSubmit={handleAddRental} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Machine Name</label>
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="e.g. 45 HP Tractor with Rotavator"
                  required
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rental Price / Rate</label>
                <input
                  type="text"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(e.target.value)}
                  placeholder="e.g. ₹600/hour or ₹3,000/day"
                  required
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe machine condition, attachments included, etc."
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 p-2 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRentalModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs"
                >
                  {loading ? 'Posting...' : 'Post Rental'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
