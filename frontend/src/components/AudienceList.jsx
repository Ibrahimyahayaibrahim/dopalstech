import { useState, useMemo } from 'react';
import { Search, Filter, Trash2, FileText, User } from 'lucide-react';

const AudienceList = ({ contacts, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('All');

  // Derive unique programs for filter dropdown
  const programs = useMemo(() => {
    const allPrograms = contacts.map(c => c.program || 'General');
    return ['All', ...new Set(allPrograms)];
  }, [contacts]);

  // Filter logic
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = (contact.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (contact.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesProgram = filterProgram === 'All' || contact.program === filterProgram;
    return matchesSearch && matchesProgram;
  });

  if (contacts.length === 0) return null;

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-enter">
      
      {/* HEADER: Search & Filter */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 text-gray-500">
            <User size={18}/>
            <span className="font-bold text-sm">{filteredContacts.length} Recipients Selected</span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input 
                    type="text" 
                    placeholder="Search name or email..." 
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter */}
            <div className="relative">
                <select 
                    className="appearance-none pl-3 pr-8 py-2 text-xs font-bold border border-gray-200 rounded-lg bg-white outline-none focus:border-emerald-500 cursor-pointer"
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                >
                    {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase sticky top-0">
                <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Program / Tag</th>
                    <th className="p-3 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredContacts.map((contact, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-3 font-medium text-gray-700">{contact.name || 'N/A'}</td>
                        <td className="p-3 text-gray-500">{contact.email}</td>
                        <td className="p-3">
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold border border-blue-100">
                                {contact.program || 'Manual Entry'}
                            </span>
                        </td>
                        <td className="p-3 text-right">
                            <button 
                                onClick={() => onDelete(idx)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        {filteredContacts.length === 0 && (
            <div className="p-8 text-center text-gray-400">
                <p>No contacts found matching your search.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AudienceList;