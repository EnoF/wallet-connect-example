import { useWalletConnectClient } from '@/providers/ClientContextProvider';
import { IAccount } from '@/types';
import { useState } from 'react';
import { onlyKey } from '@/utils/onlyKey';
import {
  addCapability,
  buildCommand,
  setDomain,
  setMeta,
  setNetworkId,
  signWithWalletConnect,
  localRaw,
} from '@/pact/pact';
import { setTransactionCommand } from '@/pact/coin';

export const TransactionButton = ({
  selectedAccount,
}: {
  selectedAccount?: IAccount;
}) => {
  const { client, session } = useWalletConnectClient();

  const [amount, setAmount] = useState<number>(0);
  const [toAccount, setToAccount] = useState<string | undefined>();

  const handleClick = async () => {
    if (!client) {
      throw new Error('No client');
    }

    if (!session) {
      throw new Error('No session');
    }

    if (!selectedAccount) {
      throw new Error('No selected account to send from');
    }

    if (!toAccount) {
      throw new Error('No account to send to set');
    }

    if (!amount) {
      throw new Error('No amount set');
    }

    const command = await buildCommand(
      setTransactionCommand(selectedAccount.account, toAccount, amount),
      setMeta({
        chainId: selectedAccount.chainId,
        gasLimit: 1000,
        gasPrice: 1.0e-6,
        ttl: 10 * 60,
        sender: selectedAccount.account,
      }),
      setNetworkId(selectedAccount.network),
      setDomain('https://api.testnet.chainweb.com'),
      addCapability({
        name: 'coin.TRANSFER',
        args: [selectedAccount.account, toAccount, amount],
        signer: onlyKey(selectedAccount.account),
      }),
      addCapability({
        name: 'coin.GAS',
        args: [],
        signer: onlyKey(selectedAccount.account),
      }),
      signWithWalletConnect(client, session),
      localRaw({ preflight: true, signatureValidation: false }),
    )({});

    console.log(command);
  };

  return (
    <>
      <h2>Transaction</h2>
      {selectedAccount ? (
        <>
          <p>
            <strong>Send from:</strong> {selectedAccount?.account}
            <br />
            <strong>Chain:</strong> {selectedAccount?.chainId}
          </p>

          <p>
            <label>
              <strong>Account to transfer to:</strong>
              <input
                type="text"
                onChange={(e) => setToAccount(e.target.value)}
              />
            </label>

            <br />

            <label>
              <strong>Amount:</strong>{' '}
              <input
                type="number"
                onChange={(e) => setAmount(parseFloat(e.target.value))}
              />
            </label>
          </p>

          <button onClick={handleClick}>Send transaction</button>
        </>
      ) : (
        <div>Select an account to send the transfer from</div>
      )}
    </>
  );
};
