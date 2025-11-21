import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { SmartActionModal } from './SmartActionModal';
import { ViewState, User, InventoryItem, ActionLog, Category, PracticeSettings, Unit } from './types';
import { getInventory, saveInventory, getLogs, addLog, getUsers, addUser, removeUser, getSettings, saveSettings, updateUserPassword, addInventoryItem, updateInventoryItem, removeInventoryItem, getCategories, saveCategories, updateUser } from './storageService';
import { ParsedInventoryAction } from './geminiService';

// --- Helper Components & Icons ---

const getCategoryIcon = (cat: string) => {
  // Try to match known categories, otherwise default
  if (cat.toLowerCase().includes('urgentie')) return <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>;
  if (cat.toLowerCase().includes('injectie')) return <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>;
  if (cat.toLowerCase().includes('diagnostica')) return <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>;
  if (cat.toLowerCase().includes('wond')) return <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  if (cat.toLowerCase().includes('kantoor')) return <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>;
  
  return <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>;
}

const formatQuantity = (item: InventoryItem) => {
    if (!item.itemsPerUnit || item.itemsPerUnit <= 1) {
        return `${item.quantity} ${item.unit}`;
    }
    const boxes = Math.floor(item.quantity / item.itemsPerUnit);
    const remainder = item.quantity % item.itemsPerUnit;
    
    if (boxes === 0) return `${remainder} stuks`;
    if (remainder === 0) return `${boxes} ${item.unit} (${item.quantity} stuks)`;
    
    return `${boxes} ${item.unit} + ${remainder} stuks`;
}

// --- Modals for Specific Actions ---

const RestockModal = ({ item, onClose, onConfirm }: { item: InventoryItem, onClose: () => void, onConfirm: (qty: number, expiry: string) => void }) => {
    const [qty, setQty] = useState(1);
    const [expiry, setExpiry] = useState(item.expiryDate || '');
    const isPackaged = item.itemsPerUnit && item.itemsPerUnit > 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-4 md:p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Voorraad Aanvullen: {item.name}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Aantal {isPackaged ? item.unit : 'stuks'} toevoegen
                        </label>
                        <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg" />
                        {isPackaged && (
                            <p className="text-xs text-teal-600 mt-1">
                                Je voegt {qty} {item.unit} toe (= {qty * (item.itemsPerUnit || 1)} stuks)
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nieuwe Vevaldatum (Optioneel)</label>
                        <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 py-2 text-slate-600 font-medium">Annuleren</button>
                        <button onClick={() => onConfirm(qty, expiry)} className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold">Aanvullen</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddItemModal = ({ categories, onClose, onConfirm }: { categories: string[], onClose: () => void, onConfirm: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: categories[0] || 'Overig',
        quantity: 0, // User enters boxes here
        minThreshold: 5,
        unit: Unit.BOX as string,
        expiryDate: '',
        location: '',
        itemsPerUnit: 1
    });

    const handleSubmit = () => {
        if(!formData.name) return;
        // Convert entered quantity (boxes) to total pieces if itemsPerUnit > 1
        const finalQuantity = formData.quantity * formData.itemsPerUnit;
        
        onConfirm({
            ...formData,
            quantity: finalQuantity
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Nieuw Item Toevoegen</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Naam</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="bv. Amoxicilline" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Categorie</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Eenheid</label>
                            <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg">
                                {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {(formData.unit === Unit.BOX || formData.unit === Unit.PACK || formData.unit === Unit.BOTTLE) && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Aantal stuks per {formData.unit}</label>
                            <input type="number" min="1" value={formData.itemsPerUnit} onChange={e => setFormData({...formData, itemsPerUnit: Math.max(1, parseInt(e.target.value))})} className="w-full p-2 border border-slate-200 rounded-lg" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Begin Voorraad ({formData.unit})</label>
                            <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Min. Drempel (Stuks)</label>
                             <input type="number" min="0" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Vervaldatum</label>
                             <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                         </div>
                         <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Locatie</label>
                             <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="bv. Kast 2"/>
                         </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                        <button onClick={onClose} className="flex-1 py-2 text-slate-600 font-medium">Annuleren</button>
                        <button onClick={handleSubmit} className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold">Toevoegen</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditItemModal = ({ item, categories, onClose, onConfirm, onDelete }: { item: InventoryItem, categories: string[], onClose: () => void, onConfirm: (item: InventoryItem) => void, onDelete: (id: string) => void }) => {
    const [formData, setFormData] = useState({ ...item });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Wijzig {item.name}</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Categorie</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                         <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Min. Drempel (Stuks)</label>
                             <input type="number" min="0" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg bg-yellow-50" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Stuks per {formData.unit}</label>
                        <input type="number" min="1" value={formData.itemsPerUnit || 1} onChange={e => setFormData({...formData, itemsPerUnit: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>

                     <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Locatie</label>
                         <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                     </div>

                     <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Vervaldatum</label>
                         <input type="date" value={formData.expiryDate || ''} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                     </div>
                    
                    <div className="flex gap-2 pt-4 items-center flex-wrap">
                        <button 
                            onClick={() => {
                                if(window.confirm("Weet je zeker dat je dit item wilt verwijderen?")) {
                                    onDelete(item.id);
                                }
                            }} 
                            className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg mr-auto order-1"
                        >
                            Verwijderen
                        </button>
                        <div className="flex gap-2 order-2 ml-auto">
                            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium">Annuleren</button>
                            <button onClick={() => onConfirm(formData)} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold">Opslaan</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReplaceStockModal = ({ item, onClose, onConfirm }: { item: InventoryItem, onClose: () => void, onConfirm: (newQty: number, newExpiry: string) => void }) => {
    const [newQty, setNewQty] = useState(item.minThreshold > 0 ? item.minThreshold : 1);
    const [newExpiry, setNewExpiry] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Vervang Verlopen Voorraad</h3>
                        <p className="text-xs text-slate-500">{item.name}</p>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-600">
                    Deze actie zal de huidige voorraad ({item.quantity} stuks) verwijderen en vervangen door nieuwe voorraad.
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nieuw Aantal (stuks)</label>
                        <input type="number" min="1" value={newQty} onChange={e => setNewQty(parseInt(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nieuwe Vevaldatum (Vereist)</label>
                        <input type="date" required value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button onClick={onClose} className="flex-1 py-2 text-slate-600 font-medium">Annuleren</button>
                        <button 
                            onClick={() => {
                                if(!newExpiry) return alert('Vul een vervaldatum in');
                                onConfirm(newQty, newExpiry);
                            }} 
                            className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
                        >
                            Vervangen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const EditUserModal = ({ user, onClose, onConfirm }: { user: User, onClose: () => void, onConfirm: (user: User) => void }) => {
    const [formData, setFormData] = useState({ ...user });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Gebruiker Bewerken</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Naam</label>
                        <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="w-full p-2 border border-slate-200 rounded-lg" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Gebruikersnaam</label>
                        <input 
                            type="text" 
                            value={formData.username} 
                            onChange={e => setFormData({...formData, username: e.target.value})} 
                            className="w-full p-2 border border-slate-200 rounded-lg" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as User['role']})}
                        >
                            <option value="Arts">Arts</option>
                            <option value="Verpleegkundige">Verpleegkundige</option>
                            <option value="Beheerder">Beheerder</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 py-2 text-slate-600 font-medium">Annuleren</button>
                        <button onClick={() => onConfirm(formData)} className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold">Opslaan</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const SettingsView = ({ 
  settings, 
  onSaveSettings, 
  currentUser,
  categories,
  onUpdateCategories
}: { 
  settings: PracticeSettings, 
  onSaveSettings: (s: PracticeSettings) => void,
  currentUser: User,
  categories: string[],
  onUpdateCategories: (cats: string[]) => void
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newCategory, setNewCategory] = useState('');

  const handleSavePractice = () => {
    onSaveSettings(localSettings);
    setMessage({ type: 'success', text: 'Praktijkinstellingen opgeslagen.' });
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Nieuwe wachtwoorden komen niet overeen.' });
      return;
    }
    if (passwords.current !== currentUser.password) {
      setMessage({ type: 'error', text: 'Huidig wachtwoord is onjuist.' });
      return;
    }
    updateUserPassword(currentUser.id, passwords.new);
    setMessage({ type: 'success', text: 'Wachtwoord succesvol gewijzigd.' });
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleAddCategory = () => {
      if (newCategory && !categories.includes(newCategory)) {
          onUpdateCategories([...categories, newCategory]);
          setNewCategory('');
      }
  }

  const handleRemoveCategory = (cat: string) => {
      onUpdateCategories(categories.filter(c => c !== cat));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pb-10">
      <h2 className="text-2xl font-bold text-slate-800">Instellingen</h2>

      {message.text && (
        <div className={`p-4 rounded-xl ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Practice Settings (Admin Only) */}
      {currentUser.role === 'Beheerder' && (
        <>
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    Praktijk Instellingen
                </h3>
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Praktijknaam</label>
                    <input 
                        type="text" 
                        value={localSettings.name}
                        onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notificatie Vervaldatum (Maanden)</label>
                    <input 
                        type="number" 
                        min="1"
                        max="12"
                        value={localSettings.expiryThresholdMonths}
                        onChange={(e) => setLocalSettings({...localSettings, expiryThresholdMonths: parseInt(e.target.value)})}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                    <p className="text-xs text-slate-500 mt-1">Items die binnen dit aantal maanden vervallen krijgen een waarschuwing.</p>
                    </div>
                    <div className="pt-2">
                    <button onClick={handleSavePractice} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 w-full md:w-auto">
                        Instellingen Opslaan
                    </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    Categorie Beheer
                </h3>
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            placeholder="Nieuwe categorie..."
                            className="flex-1 p-2 border border-slate-200 rounded-lg"
                        />
                        <button onClick={handleAddCategory} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200">
                            Toevoegen
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <div key={cat} className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-sm text-slate-700 mr-2">{cat}</span>
                                <button onClick={() => handleRemoveCategory(cat)} className="text-slate-400 hover:text-red-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}

      {/* Password Change (All Users) */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
           <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
           Wachtwoord Wijzigen
        </h3>
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Huidig Wachtwoord</label>
              <input 
                type="password" 
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nieuw Wachtwoord</label>
              <input 
                type="password" 
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bevestig Nieuw Wachtwoord</label>
              <input 
                type="password" 
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
           </div>
           <div className="pt-2">
              <button onClick={handleChangePassword} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-900 w-full md:w-auto">
                Wachtwoord Bijwerken
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const TeamManagementView = ({ 
    users, 
    currentUser, 
    onAddUser, 
    onRemoveUser, 
    onUpdateUser,
    newUser, 
    setNewUser 
}: { 
    users: User[], 
    currentUser: User | null, 
    onAddUser: (e: React.FormEvent) => void, 
    onRemoveUser: (id: string) => void,
    onUpdateUser: (user: User) => void,
    newUser: any,
    setNewUser: any
}) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);

    return (
    <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Add User Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:w-1/3 h-fit">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Nieuwe Medewerker</h2>
                <form onSubmit={onAddUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Naam</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Gebruikersnaam</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={newUser.username}
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Wachtwoord</label>
                        <input 
                            type="password" 
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as User['role']})}
                        >
                            <option value="Arts">Arts</option>
                            <option value="Verpleegkundige">Verpleegkundige</option>
                            <option value="Beheerder">Beheerder</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700">
                        Toevoegen
                    </button>
                </form>
            </div>

            {/* User List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Praktijk Team</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-xs font-medium">
                            <tr>
                                <th className="p-4">Naam</th>
                                <th className="p-4 hidden sm:table-cell">Gebruikersnaam</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4 text-right">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="p-4 flex items-center space-x-3">
                                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{user.name}</span>
                                            <span className="text-xs text-slate-500 sm:hidden">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600 hidden sm:table-cell">{user.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            user.role === 'Beheerder' ? 'bg-purple-100 text-purple-700' : 
                                            user.role === 'Arts' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => setEditingUser(user)}
                                            className="text-slate-500 hover:text-teal-600 font-medium text-xs"
                                        >
                                            Bewerk
                                        </button>
                                        {user.id !== currentUser?.id && (
                                            <button 
                                                onClick={() => onRemoveUser(user.id)}
                                                className="text-red-500 hover:text-red-700 font-medium text-xs"
                                            >
                                                Verwijder
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        {editingUser && (
            <EditUserModal 
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onConfirm={(u) => { onUpdateUser(u); setEditingUser(null); }}
            />
        )}
    </div>
    );
};

// --- Main Component ---

function App() {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>({ name: '', expiryThresholdMonths: 3 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'category' | 'name' | 'expiry' | 'location'>('category');

  // Modals & Interactions
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [replaceItem, setReplaceItem] = useState<InventoryItem | null>(null);

  // Team Management State
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'Verpleegkundige' as User['role'] });

  // Initialization
  useEffect(() => {
    setItems(getInventory());
    setLogs(getLogs());
    setUsers(getUsers());
    setPracticeSettings(getSettings());
    setCategories(getCategories());
  }, []);

  // --- Computations ---
  const filteredItems = useMemo(() => {
    // Create a copy to avoid mutating the state
    let result = [...items];
    
    if (searchQuery) {
        result = result.filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            i.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Sort
    return result.sort((a, b) => {
        switch (sortOption) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'location':
                return (a.location || '').localeCompare(b.location || '');
            case 'expiry':
                // Sort by date ascending (earliest expiring first)
                if (!a.expiryDate) return 1; // No expiry goes last
                if (!b.expiryDate) return -1;
                return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            case 'category':
            default:
                 // Sort by category, then by name
                if (a.category === b.category) return a.name.localeCompare(b.name);
                return a.category.localeCompare(b.category);
        }
    });
  }, [items, searchQuery, sortOption]);

  const lowStockItems = useMemo(() => 
    items.filter(i => i.quantity <= i.minThreshold), 
  [items]);

  const expiringItems = useMemo(() => {
    const today = new Date();
    const threshold = new Date();
    threshold.setMonth(today.getMonth() + (practiceSettings.expiryThresholdMonths || 3));
    
    return items.filter(i => {
        if (!i.expiryDate) return false;
        const exp = new Date(i.expiryDate);
        // Only show if expiry is in the future but before threshold
        // (Past expiry is implicitly handled or can be a separate check)
        return exp <= threshold && exp >= new Date(new Date().setDate(today.getDate() - 1));
    });
  }, [items, practiceSettings]);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUsers = getUsers();
    setUsers(currentUsers); // Refresh users
    
    const user = currentUsers.find(u => u.username === loginUsername && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Ongeldige gebruikersnaam of wachtwoord');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView(ViewState.DASHBOARD);
  }

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.username || !newUser.password) return;

      const userToAdd: User = {
          id: Date.now().toString(),
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`
      };

      addUser(userToAdd);
      setUsers(getUsers());
      setNewUser({ name: '', username: '', password: '', role: 'Verpleegkundige' });
  };

  const handleRemoveUser = (id: string) => {
      if (id === currentUser?.id) return;
      removeUser(id);
      setUsers(getUsers());
  };

  const handleUpdateUser = (updatedUser: User) => {
      updateUser(updatedUser);
      setUsers(getUsers());
      if(currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
  };

  const handleSaveSettings = (newSettings: PracticeSettings) => {
      saveSettings(newSettings);
      setPracticeSettings(newSettings);
  };

  const handleUpdateCategories = (newCats: string[]) => {
      saveCategories(newCats);
      setCategories(newCats);
  }

  const handleSmartAction = (action: ParsedInventoryAction) => {
    if (!currentUser) return;
    const newItems = [...items];
    const newLogs = [...logs];

    action.items.forEach(actionItem => {
      let existingItemIndex = newItems.findIndex(i => i.name.toLowerCase().includes(actionItem.name.toLowerCase()) || actionItem.name.toLowerCase().includes(i.name.toLowerCase()));

      if (existingItemIndex >= 0) {
        const existing = newItems[existingItemIndex];
        let qtyChange = actionItem.quantity;
        if (action.intent === 'DISPENSE') qtyChange = -qtyChange;

        const updatedItem = {
          ...existing,
          quantity: Math.max(0, existing.quantity + qtyChange),
          lastUpdated: new Date().toISOString(),
          ...(action.intent === 'RESTOCK' && actionItem.expiryDate ? { expiryDate: actionItem.expiryDate } : {}),
        };
        newItems[existingItemIndex] = updatedItem;

        newLogs.unshift({
          id: Date.now().toString() + Math.random(),
          itemId: existing.id,
          itemName: existing.name,
          userId: currentUser.id,
          userName: currentUser.name,
          action: action.intent,
          quantityChanged: qtyChange,
          timestamp: new Date().toISOString(),
          notes: action.summary
        });

      } else if (action.intent === 'RESTOCK') {
        // Create new item
        const newItem: InventoryItem = {
          id: Date.now().toString() + Math.random(),
          name: actionItem.name,
          category: actionItem.category || 'Kantoorbenodigdheden',
          quantity: actionItem.quantity,
          unit: (actionItem.unit as any) || Unit.PIECE,
          minThreshold: 5,
          lastUpdated: new Date().toISOString(),
          expiryDate: actionItem.expiryDate,
          batchNumber: actionItem.batchNumber
        };
        newItems.push(newItem);
         
         newLogs.unshift({
          id: Date.now().toString() + Math.random(),
          itemId: newItem.id,
          itemName: newItem.name,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'RESTOCK',
          quantityChanged: actionItem.quantity,
          timestamp: new Date().toISOString(),
          notes: 'Nieuw item via Smart Add: ' + action.summary
        });
      }
    });

    setItems(newItems);
    setLogs(newLogs.slice(0, 100));
    saveInventory(newItems);
    addLog(newLogs[0]);
  };

  const handleDispense = (itemId: string) => {
      if(!currentUser) return;
      const newItems = items.map(i => {
          if (i.id === itemId) {
              return { ...i, quantity: Math.max(0, i.quantity - 1), lastUpdated: new Date().toISOString() };
          }
          return i;
      });

      const item = items.find(i => i.id === itemId);
      if (item) {
          const log: ActionLog = {
              id: Date.now().toString(),
              itemId: item.id,
              itemName: item.name,
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'DISPENSE',
              quantityChanged: -1,
              timestamp: new Date().toISOString(),
              notes: 'Snelle uitgifte'
          };
          setLogs([log, ...logs]);
          addLog(log);
      }
      setItems(newItems);
      saveInventory(newItems);
  };

  const handleRestockConfirm = (qty: number, expiry: string) => {
      if(!currentUser || !restockItem) return;
      
      // If item has itemsPerUnit > 1, input qty is Boxes, so multiply for total pieces
      const addedPieces = restockItem.itemsPerUnit && restockItem.itemsPerUnit > 1 
          ? qty * restockItem.itemsPerUnit 
          : qty;

      const newItems = items.map(i => {
          if (i.id === restockItem.id) {
              return { 
                  ...i, 
                  quantity: i.quantity + addedPieces, 
                  lastUpdated: new Date().toISOString(),
                  expiryDate: expiry || i.expiryDate // Update expiry if provided
              };
          }
          return i;
      });

      const log: ActionLog = {
          id: Date.now().toString(),
          itemId: restockItem.id,
          itemName: restockItem.name,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'RESTOCK',
          quantityChanged: addedPieces,
          timestamp: new Date().toISOString(),
          notes: `Aanvulling (+${addedPieces} stuks)` + (expiry ? `, nieuwe exp: ${expiry}` : '')
      };
      
      setLogs([log, ...logs]);
      addLog(log);
      setItems(newItems);
      saveInventory(newItems);
      setRestockItem(null);
  };

  const handleAddItemConfirm = (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
      const newItem: InventoryItem = {
          id: Date.now().toString(),
          lastUpdated: new Date().toISOString(),
          ...data
      };
      addInventoryItem(newItem);
      setItems(getInventory());
      setIsAddModalOpen(false);
  };

  const handleEditItemConfirm = (updatedItem: InventoryItem) => {
      updateInventoryItem(updatedItem);
      setItems(getInventory());
      setEditItem(null);
  };

  const handleDeleteItem = (id: string) => {
      removeInventoryItem(id);
      setItems(getInventory());
      setEditItem(null);
      setSelectedCategory(null); // Close modal if open to refresh/prevent errors
  }

  const handleReplaceStock = (newQty: number, newExpiry: string) => {
      if(!currentUser || !replaceItem) return;

      const oldQty = replaceItem.quantity;
      const newItems = items.map(i => {
          if (i.id === replaceItem.id) {
              return {
                  ...i,
                  quantity: newQty,
                  expiryDate: newExpiry,
                  lastUpdated: new Date().toISOString()
              };
          }
          return i;
      });

      // Log Dispense (removal of old)
      const log1: ActionLog = {
          id: Date.now().toString() + '1',
          itemId: replaceItem.id,
          itemName: replaceItem.name,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'DISPENSE',
          quantityChanged: -oldQty,
          timestamp: new Date().toISOString(),
          notes: 'Vervangen wegens vervaldatum'
      };

      // Log Restock (add new)
      const log2: ActionLog = {
          id: Date.now().toString() + '2',
          itemId: replaceItem.id,
          itemName: replaceItem.name,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'RESTOCK',
          quantityChanged: newQty,
          timestamp: new Date(Date.now() + 100).toISOString(),
          notes: `Nieuwe voorraad na vervanging, exp: ${newExpiry}`
      };

      setLogs([log2, log1, ...logs]);
      addLog(log1);
      addLog(log2);
      setItems(newItems);
      saveInventory(newItems);
      setReplaceItem(null);
  };

  // --- Render Views ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 mx-4">
           <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                 <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
           </div>
           <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">MediTrack Inloggen</h2>
           <p className="text-center text-slate-500 mb-8">{practiceSettings.name}</p>
           
           <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gebruikersnaam</label>
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="bijv. arts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wachtwoord</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {loginError && <p className="text-red-600 text-sm text-center">{loginError}</p>}
              <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all">
                Inloggen
              </button>
           </form>
        </div>
      </div>
    );
  }
  
  const DashboardView = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Welkom bij {practiceSettings.name}</h2>
          <p className="text-slate-500">Overzicht van uw praktijkvoorraad</p>
      </div>
      
      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
         {categories.map((cat) => (
             <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group text-left flex flex-col h-32 justify-between"
             >
                <div className="bg-slate-50 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                    {getCategoryIcon(cat)}
                </div>
                <div>
                    <p className="font-semibold text-slate-700 text-xs md:text-sm leading-tight line-clamp-2">{cat}</p>
                    <p className="text-xs text-slate-400 mt-1">{items.filter(i => i.category === cat).length} items</p>
                </div>
             </button>
         ))}
      </div>

      {/* Notifications Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Attentie Vereist</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowStockItems.length === 0 && expiringItems.length === 0 && (
                    <div className="text-center text-slate-400 py-8 col-span-2">Geen waarschuwingen. Alles ziet er goed uit!</div>
                )}
                
                {lowStockItems.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl gap-3">
                        <div className="flex items-center space-x-3">
                             <div className="bg-white p-2 rounded-lg text-red-500 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                             </div>
                             <div>
                                 <p className="font-medium text-slate-800">{item.name}</p>
                                 <p className="text-xs text-red-600">Laag voorraad: {formatQuantity(item)} (Min: {item.minThreshold} stuks)</p>
                             </div>
                        </div>
                        <button 
                            onClick={() => setRestockItem(item)}
                            className="text-xs font-bold text-red-700 bg-white px-3 py-2 rounded-lg shadow-sm hover:bg-red-50 w-full sm:w-auto"
                        >
                            Aanvullen
                        </button>
                    </div>
                ))}

                {expiringItems.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl gap-3">
                        <div className="flex items-center space-x-3">
                             <div className="bg-white p-2 rounded-lg text-orange-500 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                             </div>
                             <div>
                                 <p className="font-medium text-slate-800">{item.name}</p>
                                 <p className="text-xs text-orange-600">Verloopt op {item.expiryDate}</p>
                             </div>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setReplaceItem(item)}
                                className="text-xs font-bold text-orange-700 bg-white px-3 py-2 rounded-lg shadow-sm hover:bg-orange-100 w-full sm:w-auto"
                            >
                                Vervang
                            </button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    </div>
  );

  const InventoryListView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
                {searchQuery ? `Zoekresultaten: "${searchQuery}"` : 'Volledige Voorraad'}
            </h2>
            <div className="flex space-x-2 w-full sm:w-auto">
                 <select 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-500 flex-1 sm:flex-none"
                >
                    <option value="category">Sorteer: Categorie</option>
                    <option value="name">Sorteer: Naam</option>
                    <option value="expiry">Sorteer: Vervaldatum</option>
                    <option value="location">Sorteer: Locatie</option>
                </select>
                <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 whitespace-nowrap">
                    + Nieuw
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-medium">
                    <tr>
                        <th className="p-4">Naam</th>
                        <th className="p-4 hidden sm:table-cell">Categorie</th>
                        <th className="p-4 hidden md:table-cell">Locatie</th>
                        <th className="p-4 hidden sm:table-cell">Vervaldatum</th>
                        <th className="p-4 text-right">Aantal</th>
                        <th className="p-4 text-center w-40">Actie</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item, index) => {
                        const showHeader = sortOption === 'category' && (index === 0 || item.category !== filteredItems[index - 1].category);
                        
                        return (
                        <React.Fragment key={item.id}>
                            {showHeader && (
                                <tr className="bg-slate-100/50">
                                    <td colSpan={6} className="px-4 py-2 font-bold text-teal-800 text-xs uppercase tracking-wider border-y border-slate-200">
                                        {item.category}
                                    </td>
                                </tr>
                            )}
                            <tr className="hover:bg-slate-50 group">
                                <td className="p-4 font-medium text-slate-800">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <span>{item.name}</span>
                                        {/* Mobile Details */}
                                        <div className="sm:hidden text-[10px] text-slate-400 font-normal mt-1 space-y-0.5">
                                            <div>{item.category}</div>
                                            <div>{item.location}</div>
                                            {item.expiryDate && <div className={new Date(item.expiryDate) < new Date() ? 'text-red-500' : ''}>Exp: {item.expiryDate}</div>}
                                        </div>

                                        <div className="flex space-x-1 mt-1 sm:mt-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditItem(item)} className="p-1.5 text-slate-400 hover:text-teal-600 rounded hover:bg-teal-50" title="Bewerken">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button onClick={() => { if(window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) handleDeleteItem(item.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" title="Verwijderen">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 hidden sm:table-cell"><span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">{item.category}</span></td>
                                <td className="p-4 text-slate-500 hidden md:table-cell">{item.location || '-'}</td>
                                <td className={`p-4 hidden sm:table-cell ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-red-500 font-bold' : ''}`}>
                                    {item.expiryDate || '-'}
                                </td>
                                <td className="p-4 text-right font-mono font-medium whitespace-nowrap">
                                    {formatQuantity(item)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex flex-col space-y-2 w-full">
                                        <button 
                                            onClick={() => handleDispense(item.id)}
                                            className="w-full py-2 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm uppercase"
                                            title="Gebruik 1 Stuk"
                                        >
                                            GEBRUIK
                                        </button>
                                        <button 
                                            onClick={() => setRestockItem(item)}
                                            className="w-full py-1.5 text-[10px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Aanvullen
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { setCurrentView(view); setSearchQuery(''); }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-wrap md:flex-nowrap items-center justify-between z-10 gap-4">
            <div className="flex items-center lg:hidden">
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
            </div>

            {/* Practice Name Display (Mobile/Small) */}
             <div className="lg:hidden">
                <h1 className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{practiceSettings.name}</h1>
            </div>
            
            {/* Search Bar - Full width on mobile, auto on desktop */}
            <div className="flex items-center w-full order-3 md:order-none md:flex-1 md:w-auto md:max-w-md md:ml-auto md:mr-4">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                         <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input 
                        type="text" 
                        className="w-full py-2 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="Zoek materiaal..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value && currentView !== ViewState.INVENTORY) {
                                setCurrentView(ViewState.INVENTORY);
                            }
                        }}
                    />
                </div>
            </div>

            {/* User Menu & Smart Action */}
            <div className="flex items-center space-x-4 ml-auto md:ml-0">
                <button 
                    onClick={() => setIsSmartModalOpen(true)}
                    className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>Slimme Actie</span>
                </button>

                {currentUser && (
                    <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 cursor-pointer group relative">
                         <img src={currentUser.avatar} alt="User" className="w-8 h-8 rounded-full" />
                         <div className="hidden md:block text-left">
                             <p className="text-sm font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
                             <p className="text-xs text-slate-500 leading-tight">{currentUser.role}</p>
                         </div>
                         <button onClick={handleLogout} className="ml-2 text-slate-400 hover:text-red-500" title="Uitloggen">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                         </button>
                    </div>
                )}
            </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {currentView === ViewState.DASHBOARD && <DashboardView />}
                {currentView === ViewState.INVENTORY && <InventoryListView />}
                {currentView === ViewState.TEAM && currentUser?.role === 'Beheerder' && (
                    <TeamManagementView 
                        users={users}
                        currentUser={currentUser}
                        onAddUser={handleAddUser}
                        onRemoveUser={handleRemoveUser}
                        onUpdateUser={handleUpdateUser}
                        newUser={newUser}
                        setNewUser={setNewUser}
                    />
                )}
                {currentView === ViewState.SETTINGS && currentUser && (
                    <SettingsView 
                        settings={practiceSettings} 
                        onSaveSettings={handleSaveSettings} 
                        currentUser={currentUser}
                        categories={categories}
                        onUpdateCategories={handleUpdateCategories}
                    />
                )}
                {currentView === ViewState.REPORTS && (
                     <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm text-center">
                         <h2 className="text-xl font-bold text-slate-800 mb-2">Activiteiten Logboek</h2>
                         <div className="max-w-3xl mx-auto text-left mt-8 space-y-4">
                             {logs.map(log => (
                                 <div key={log.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex flex-col sm:flex-row justify-between items-start gap-2">
                                     <div>
                                         <p className="font-medium text-slate-800">{log.notes || `${log.action} actie`}</p>
                                         <p className="text-xs text-slate-500 mt-1">door {log.userName} • {log.itemName} ({log.quantityChanged > 0 ? '+' : ''}{log.quantityChanged})</p>
                                     </div>
                                     <span className="text-xs text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                )}
            </div>
        </main>

      </div>

      {/* Modals */}
      <SmartActionModal 
        isOpen={isSmartModalOpen} 
        onClose={() => setIsSmartModalOpen(false)} 
        onConfirm={handleSmartAction}
      />
      
      {isAddModalOpen && (
          <AddItemModal
            categories={categories}
            onClose={() => setIsAddModalOpen(false)}
            onConfirm={handleAddItemConfirm}
          />
      )}

      {editItem && (
          <EditItemModal
             item={editItem}
             categories={categories}
             onClose={() => setEditItem(null)}
             onConfirm={handleEditItemConfirm}
             onDelete={handleDeleteItem}
          />
      )}

      {restockItem && (
          <RestockModal 
            item={restockItem} 
            onClose={() => setRestockItem(null)} 
            onConfirm={handleRestockConfirm} 
          />
      )}

      {replaceItem && (
          <ReplaceStockModal 
            item={replaceItem}
            onClose={() => setReplaceItem(null)}
            onConfirm={handleReplaceStock}
          />
      )}

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedCategory(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-slate-50 p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-teal-600">
                           {getCategoryIcon(selectedCategory)}
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">{selectedCategory}</h2>
                    </div>
                    <button onClick={() => setSelectedCategory(null)} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto p-4 md:p-6">
                    <div className="space-y-3">
                        {items.filter(i => i.category === selectedCategory).length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Geen items in deze categorie.</p>
                        ) : (
                            items.filter(i => i.category === selectedCategory).map(item => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-teal-100 transition-colors gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-800">{item.name}</p>
                                            {item.expiryDate && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${new Date(item.expiryDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    Exp: {item.expiryDate}
                                                </span>
                                            )}
                                            <div className="flex space-x-1 ml-2">
                                                <button onClick={() => setEditItem(item)} className="text-slate-300 hover:text-teal-600">
                                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={() => { if(window.confirm('Verwijderen?')) handleDeleteItem(item.id); }} className="text-slate-300 hover:text-red-600">
                                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">{formatQuantity(item)} • Locatie: {item.location || 'Onbekend'}</p>
                                        {item.quantity <= item.minThreshold && (
                                            <span className="inline-block mt-1 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">LAAG (Min: {item.minThreshold})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto sm:space-x-4">
                                        <div className="text-right mr-4 sm:mr-0">
                                            <span className="block text-xl font-bold text-slate-800">{item.quantity}</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Stuks</span>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <button 
                                                onClick={() => handleDispense(item.id)}
                                                className="px-6 py-2 text-xs uppercase tracking-wide font-bold bg-red-600 text-white rounded shadow-sm hover:bg-red-700 transition-colors"
                                            >
                                                Gebruik
                                            </button>
                                            <button 
                                                onClick={() => setRestockItem(item)}
                                                className="px-3 py-1 text-[10px] uppercase tracking-wide font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                                            >
                                                Aanvullen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;