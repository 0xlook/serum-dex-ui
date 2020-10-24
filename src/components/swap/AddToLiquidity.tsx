import React, { useState } from 'react';
import {
  addLiquidity,
  usePoolForBasket,
  useSwapContext,
} from '../../utils/swap';
import { Button, Popover } from 'antd';
import { useWallet } from '../../utils/wallet';
import { useConnection } from '../../utils/connection';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { notify } from '../../utils/notifications';
import { SupplyOverview } from './SupplyOverview';
import { CurrencyInput, useCurrencyPairState } from './CurrencyInput';
import { useSlippageConfig } from '../../utils/swap';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

export const AddToLiquidity = () => {
  const { wallet } = useWallet();
  const connection = useConnection();
  const [pendingTx, setPendingTx] = useState(false);
  const { A, B, setLastTypedAccount } = useCurrencyPairState();
  const pool = usePoolForBasket([A?.mintAddress, B?.mintAddress]);
  const { slippage } = useSlippageConfig();
  const {
    tokenProgramId,
    swapProgramId,
    legacySwapProgramIds,
  } = useSwapContext();

  const provideLiquidity = async () => {
    if (A.account && B.account && A.mint && B.mint) {
      setPendingTx(true);
      const components = [
        {
          account: A.account,
          amount: A.convertAmount(),
        },
        {
          account: B.account,
          amount: B.convertAmount(),
        },
      ];

      addLiquidity(
        connection,
        wallet,
        components,
        slippage,
        swapProgramId,
        legacySwapProgramIds,
        tokenProgramId,
        pool,
      )
        .then(() => {
          setPendingTx(false);
        })
        .catch((e) => {
          console.log(`received error adding liquidity ${e}`);
          notify({
            description:
              'Please try again and approve transactions from your wallet',
            message: 'Adding liquidity cancelled.',
            type: 'error',
          });
          setPendingTx(false);
        });
    }
  };

  return (
    <div>
      <Popover
        trigger="hover"
        style={{ width: '100%', textAlign: 'center' }}
        content={
          <div style={{ width: 300 }}>
            Liquidity providers earn a 0.3% fee on all trades proportional to
            their share of the pool. Fees are added to the pool, accrue in real
            time and can be claimed by withdrawing your liquidity.
          </div>
        }
      >
        <Button style={{ width: '100%', textAlign: 'center' }} type="text">
          Read more about providing liquidity.
        </Button>
      </Popover>

      <CurrencyInput
        title="Input"
        onInputChange={(val: any) => {
          if (A.amount !== val) {
            setLastTypedAccount(A.mintAddress);
          }

          A.setAmount(val);
        }}
        amount={A.amount}
        mint={A.mintAddress}
        onMintChange={(item) => {
          A.setMint(item);
        }}
      />
      <div style={{ width: '100%', textAlign: 'center' }}>+</div>
      <CurrencyInput
        title="Input"
        onInputChange={(val: any) => {
          if (B.amount !== val) {
            setLastTypedAccount(B.mintAddress);
          }

          B.setAmount(val);
        }}
        amount={B.amount}
        mint={B.mintAddress}
        onMintChange={(item) => {
          B.setMint(item);
        }}
      />
      {pool && <SupplyOverview pool={pool} />}
      <Button
        type="primary"
        size="large"
        onClick={provideLiquidity}
        style={{ width: '100%' }}
        disabled={
          pendingTx || !A.account || !B.account || A.account === B.account
        }
      >
        Provide Liquidity
        {pendingTx && <Spin indicator={antIcon} />}
      </Button>
    </div>
  );
};