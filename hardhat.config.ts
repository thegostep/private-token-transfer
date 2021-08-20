import '@nomiclabs/hardhat-ethers'

import { HardhatUserConfig, task } from 'hardhat/config'
import { formatEther } from 'ethers/lib/utils'
import ERC20_ABI from './ERC20_ABI'

const mnemonic = process.env.DEV_MNEMONIC as string

task('transfer-private')
  .addParam('token', 'token address')
  .addParam('recipient', 'recipient address')
  .setAction(async (args, { ethers, run, network }) => {
    // log config

    console.log('Network')
    console.log('  ', network.name)
    console.log('Task Args')
    console.log(args)

    // compile

    await run('compile')

    // get signer

    let signer = (await ethers.getSigners())[0]
    console.log('Signer')
    console.log('  at', signer.address)
    console.log('  ETH', formatEther(await signer.getBalance()))

    // fetch data

    const token = await ethers.getContractAt(ERC20_ABI, args.token, signer)
    const balance = await token.callStatic.balanceOf(signer.address)

    // transfer using taichi

    const populatedTx = await signer.populateTransaction({
      to: token.address,
      data: token.interface.encodeFunctionData('transfer', [
        args.recipient,
        balance,
      ]),
    })

    const signedTx = await signer.signTransaction(populatedTx)

    const taichi = new ethers.providers.JsonRpcProvider(
      'https://api.taichi.network:10001/rpc/private',
      'mainnet',
    )

    const txReceipt = await taichi.sendTransaction(signedTx)
    console.log(`  in https://taichi.network/tx/${txReceipt.hash}`)
  })

export default {
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
    },
  },
} as HardhatUserConfig
