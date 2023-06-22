const sdk = require('@defillama/sdk')

const { queryContract } = require('../helper/chain/cosmos')
const { transformBalances } = require('../helper/portedTokens')
const { sumTokensExport } = require('../helper/sumTokens')
const chain = 'osmosis'
const redbankContract = 'osmo1c3ljch9dfw5kf52nfwpxd2zmj2ese7agnx0p9tenkrryasrle5sqf3ftpg'
const farmCreditManagerContract = 'osmo1f2m24wktq0sw3c0lexlg7fv4kngwyttvzws3a3r3al9ld2s2pvds87jqvf'

async function borrowed() {
  var lastDenom = ""
  var lastResponse = []
  var res

  do {
    res = await queryContract({ contract: redbankContract, chain: 'osmosis', data: { markets: {start_after: lastDenom} } })
    const resLength = res.length
    lastResponse.push(...res)
    if (resLength != 0) {
      lastDenom = res[resLength - 1].denom
    }
  } while (res.length != 0)
  
  const borrowed = {};
  lastResponse.forEach(i => {
    sdk.util.sumSingleBalance(borrowed, i.denom, i.debt_total_scaled * i.borrow_index / 1e6)
  })

  return transformBalances(chain, borrowed)
}

async function marsFarmCreditManager(){
  let responses = await queryContract({ contract: farmCreditManagerContract, chain: 'osmosis', data: { vaults_info: { } } })
  responses.forEach(i => {
    console.log(i['utilization'])
  })
  console.log('----------------------------------------------------------------')
  responses = await queryContract({ contract: farmCreditManagerContract, chain: 'osmosis', data: { all_vault_positions : { } } })
  responses.forEach(i => {
    console.log(i['position'])
  })
  console.log('----------------------------------------------------------------')

  responses = await queryContract({ contract: farmCreditManagerContract, chain: 'osmosis', data: { all_total_vault_coin_balances : { } } })
  console.log(responses)
  console.log('----------------------------------------------------------------')

  responses = await queryContract({ contract: farmCreditManagerContract, chain: 'osmosis', data: { all_total_debt_shares : { } } })
  console.log(responses)
  return {}
}


module.exports = {
  timetravel: false,
  methodology: "sum up token balances in Mars smart contract in osmosis",
  osmosis: {
    tvl: marsFarmCreditManager,
    borrowed,
  },
  terra: {
    tvl: () => 0,
  },
   hallmarks:[
    [1651881600, "UST depeg"],
    [1675774800, "Relaunch on Osmosis"],
  ]
};
