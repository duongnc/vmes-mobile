import { create } from 'zustand';

// Định nghĩa kiểu dữ liệu
interface BomItem {
  id: number;
  mpn: string;
  name: string;
  dateCode: string;
  isScanned: boolean;
}

interface BomStore {
  currentWO: string;
  bomList: BomItem[];
  setBomList: (list: BomItem[]) => void;
  markAsScanned: (mpnPart: string) => boolean; // Trả về true nếu quét thành công
  resetAndSwitchWO: (newWO: string, newBomList: BomItem[]) => void;
}

// Dữ liệu mẫu cho lệnh WO-2428
export const MOCK_BOM_WO2428: BomItem[] = [
  { id: 3, mpn: 'MAX31855', name: 'IC Cảm biến', dateCode: '2310', isScanned: false },
  { id: 4, mpn: 'RES10K', name: 'Điện trở 10K', dateCode: '2402', isScanned: false },
];

export const useBomStore = create<BomStore>((set, get) => ({
  currentWO: 'WO-2427',
  bomList: [
    { id: 1, mpn: 'ADUM4160', name: 'IC Cách ly', dateCode: '2345', isScanned: false },
    { id: 2, mpn: 'STM32F407', name: 'Vi điều khiển', dateCode: '2401', isScanned: false },
  ],

  setBomList: (list) => set({ bomList: list }),

  // Logic đối soát đưa hẳn vào store cho gọn component
  markAsScanned: (scannedCode) => {
    let isUpdated = false;
    const currentList = get().bomList;
    
    const newList = currentList.map(item => {
      if (scannedCode.includes(item.mpn) && !item.isScanned) {
        isUpdated = true;
        return { ...item, isScanned: true };
      }
      return item;
    });

    if (isUpdated) {
      set({ bomList: newList });
    }
    return isUpdated;
  },

  // Hàm dọn dẹp state cũ và nạp lệnh mới bằng set
  resetAndSwitchWO: (newWO, newBomList) => set({ 
    currentWO: newWO, 
    bomList: newBomList 
  }),
}));