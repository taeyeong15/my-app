'use client';

import { useEffect, useState } from 'react';

interface Product {
  product_code: string;
  product_name: string;
  created_by: string;
  created_at: string;
}

export interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productCode: string) => void;
  selectedCodes: string[];
}

export default function ProductSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedCodes
}: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // 상품 데이터 로드 (모달 열림 시 + 검색어 변경 시)
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        loadProducts();
      }, 300); // 300ms 디바운스
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, searchTerm]);

  // 검색 결과를 filteredProducts로 설정
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const url = searchTerm.trim() 
        ? `/api/products?search=${encodeURIComponent(searchTerm.trim())}`
        : '/api/products';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('상품 로드 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getProductIcon = (productCode: string) => {
    if (productCode.startsWith('PROD')) return '📱';
    if (productCode.startsWith('CAT')) return '📂';
    if (productCode.startsWith('BRAND')) return '🏷️';
    return '📦';
  };

  const getProductType = (productCode: string) => {
    if (productCode.startsWith('PROD')) return '상품';
    if (productCode.startsWith('CAT')) return '카테고리';
    if (productCode.startsWith('BRAND')) return '브랜드';
    return '기타';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🛍️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">상품 선택</h3>
                  <p className="text-blue-100 text-sm">적용할 상품을 선택해주세요</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>

          {/* 검색 영역 */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="상품 코드 또는 상품명으로 검색..."
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* 상품 목록 */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">상품 로딩 중...</p>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedCodes.includes(product.product_code);
                    return (
                      <div
                        key={product.product_code}
                        onClick={() => onSelect(product.product_code)}
                        className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer transform hover:scale-102 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <span className="text-xl">{getProductIcon(product.product_code)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`font-bold truncate ${
                                isSelected ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {product.product_name}
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {getProductType(product.product_code)}
                              </span>
                            </div>
                            <p className={`text-sm font-mono truncate ${
                              isSelected ? 'text-blue-700' : 'text-gray-600'
                            }`}>
                              {product.product_code}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <span className="text-white text-sm">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredProducts.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">검색 결과가 없습니다</h3>
                    <p className="text-gray-500">다른 검색어로 시도해보세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-2xl">
            <div className="text-sm text-gray-600">
              선택된 항목: <span className="font-bold text-blue-600">{selectedCodes.length}개</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 