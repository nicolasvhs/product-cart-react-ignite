import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const addedProduct = newCart.find(product => product.id == productId);
      const item = await api.get(`/stock/${productId}`);
      const itemStock = item.data.amount; //1
      
      const updatedAmount = addedProduct ? addedProduct.amount + 1 : 1;
    
      if (updatedAmount > itemStock){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (addedProduct){
        addedProduct.amount = updatedAmount;
      } else {
        const loadedProduct = await api.get(`/products/${productId}`);
        const newProduct = {
          ...loadedProduct.data,
          amount: 1
        };
        newCart.push(newProduct);
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const indexProduct = cart.findIndex(p => p.id == productId);
      if (indexProduct >= 0){
        newCart.splice(indexProduct, 1);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0){
        return;
      }
      
      const productData = await api.get(`/stock/${productId}`);
      const stockAmount = productData.data.amount;

      if (stockAmount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];

      const productCart = newCart.find(p => p.id == productId);
      if (productCart){
        productCart.amount = amount;
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
