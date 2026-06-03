/**
 * client/src/context/CartContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * CART CONTEXT (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { computeCartItemPrice } from '@/utils/unitConverter';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback(
    (product, quantity, selectedUnit) => {
      const calculatedPrice = computeCartItemPrice(product, quantity, selectedUnit);

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.product.id === product.id
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            product,
            quantity,
            selectedUnit,
            calculatedPrice,
          };
          return updated;
        }

        return [...prev, { product, quantity, selectedUnit, calculatedPrice }];
      });
    },
    []
  );

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateItem = useCallback(
    (productId, quantity, selectedUnit) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.product.id !== productId) return item;

          return {
            ...item,
            quantity,
            selectedUnit,
            calculatedPrice: computeCartItemPrice(
              item.product,
              quantity,
              selectedUnit
            ),
          };
        })
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.calculatedPrice, 0),
    [items]
  );

  const itemCount = items.length;

  const value = {
    items,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    cartTotal,
    itemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart() must be called inside a <CartProvider>');
  }

  return context;
}
