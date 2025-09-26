import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Home, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ShelfCard, type ShelfItem } from '@/components/document/ShelfCard';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || '';

interface OrgUnit {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  parent_name?: string | null;
  is_active: boolean;
  image?: string | null;
}

const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);

  const fetchOrgUnits = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/metadata/org-units`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OrgUnit[] = await res.json();
      setOrgUnits(data);
    } catch (e) {
      console.error('Failed to fetch org units:', e);
      setOrgUnits([]);
    }
  };

  useEffect(() => {
    fetchOrgUnits();
  }, []);

  const filteredRootShelves = useMemo<ShelfItem[]>(() => {
    const q = searchQuery.toLowerCase();
    const topLevel = orgUnits.filter((u) => u.parent_id === null);
    return topLevel
      .map<ShelfItem>((u) => ({
        id: u.id,
        name: u.name,
        description: u.code,
        image: u.image ? `/src/assets/${u.image}` : undefined,
      }))
      .filter((s) => s.name.toLowerCase().includes(q));
  }, [orgUnits, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Breadcrumb Section */}
      <div className="bg-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pt-6">
          <div className="flex items-center text-sm text-gray-600">
            <Home className="h-4 w-4 mr-2 text-blue-600" />
            <Link to="/" className="hover:text-blue-700 hover:underline transition-colors duration-200">
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            <span className="text-blue-700 font-medium">Phòng ban</span>
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            {/* Title Section */}
            <div className="">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight animate-slide-up">
                Phòng ban
              </h1>
            </div>

            {/* Search Section */}
            <div className="w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white rounded-md transition-all duration-200 hover:shadow-sm w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white rounded-xl p-6 border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredRootShelves.map((shelf: ShelfItem) => (
                <div
                  key={shelf.id}
                  className="transform transition-all duration-300 hover:scale-105 hover:shadow-md h-full"
                >
                  <ShelfCard shelf={shelf} onClick={() => navigate(`/documents/shelf/${shelf.id}`)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;