// vaults are closed: https://articles.apollo.farm/apollo-dao-will-be-closing-vaults-on-terra-classic/
const axios = require("axios");
const { endPoints, queryContract } = require('../helper/chain/cosmos')
const { transformBalances } = require('../helper/portedTokens')

const chain = 'osmosis'

const contractAddresses = {
    atom_statom: "osmo1a6tcf60pyz8qq2n532dzcs7s7sj8klcmra04tvaqympzcvxqg9esn7xz7l",
    atom_osmo: "osmo1g3kmqpp8608szfp0pdag3r6z85npph7wmccat8lgl3mp407kv73qlj7qwp",
    usdc_osmo: "osmo1jfmwayj8jqp9tfy4v4eks5c2jpnqdumn8x8xvfllng0wfes770qqp7jl4j",
    st_osmo_osmo: "osmo1p4zqs5y2w5srzd2vesznzu5ql8wfq9tpz3e7mf2j3y07nxrtkdes5r5g0t",
    wbtc_osmo: "osmo185gqewrlde8vrqw7j8lpad67v8jfrx9u7770k9q87tqqecctp5tq50wt2c",
    strd_osmo: "osmo1e3qjfcg9adrauz6jg030ptfy35r6zzplsgaavnn6xrh6686udhfqq7muwy",
    evmos_osmo: "osmo1rkv6vcmty4rpypuxp2a6a0y5ze4ztm3y6d6xwy5a7cye85f7reqsm85c5s",
    juno_osmo: "osmo1ceku0zks6y43r9l35n7wnv5pf82s6l4k5jhlrhkurakeemey9n4snz3x6z",
    weth_osmo: "osmo1r235f4tdkwrsnj3mdm9hf647l754y6g6xsmz0nas5r4vr5tda3qsgtftef",
    ist_osmo: "osmo1qajgwrcce9srkq370pa9ew96dyk4hajyyk6rfpuexrktm8862xnst443kp",
    ion_osmo: "osmo1869zena97sctemj78sgjmu737p2g94905hsf3hhkrfgummrfz4tsxj2k6r",
    cro_osmo: "osmo1gmd2vc4crmv7urlfn3j5avhplfncjf5mg649dkgsu5a0zvd6cgrsn9dq4l",
    axl_osmo: "osmo1m9e4cks405tvzlppkw64znr35vkvujvptrdqtgu5q6luk4ccw9qqeuenwd",
    dai_osmo: "osmo1lhs6kyuxytu4suua0qf88z5057wzpxs77tyrlgztw2uctcy75hcqf2ajrt",
    akt_osmo: "osmo122ryl7pez7yjprtvjckltu2uvjxrq3kqt4nvclax2la7maj6757qg054ga",
};

async function tvl() {
    let amounts = {}
    if (chain != "osmosis") return transformBalances(chain, amounts)
    for (const contractName in contractAddresses) {
        let contractAddress = contractAddresses[contractName];
        let vaultInfo = await queryContract({
            contract: contractAddress,
            chain: 'osmosis',
            data: { 'info': {} } 
          });
        const gammToken = vaultInfo.base_token;
        const poolID = gammToken.split('gamm/pool/')[1];
        let totalAssets = await queryContract({
            contract: contractAddress,
            chain: 'osmosis',
            data: { 'total_assets': {} } 
          });

        let poolEndpoint = `${endPoints[chain]}/osmosis/gamm/v1beta1/pools/${poolID}`;
        const poolData = (await axios.get(poolEndpoint)).data.pool;

        let amount = calculateTokenAmounts(poolData, totalAssets)
        for (const denom in amount) {
            if (typeof amounts[denom] === "undefined") {
                amounts[denom] = amount[denom];
            } else {
                amounts[denom] += amount[denom];
            }
        }
    }
    return transformBalances(chain, amounts)
}

function calculateTokenAmounts(poolData, gammAmount) {
    // Extract the total pool shares.
    let totalShares = poolData.total_shares.amount;

    // Initialize an object to hold the amounts of each token.
    let tokenAmounts = {};

    // For each token in the pool...
    if (typeof poolData.pool_assets !== "undefined") {
        for (let asset of poolData.pool_assets) {
            // Extract the token's denom and amount.
            let denom = asset.token.denom;
            let assetAmount = asset.token.amount;
    
            // Calculate the amount of this token that corresponds to the given amount of pool shares.
            tokenAmounts[denom] = (gammAmount * assetAmount) / totalShares;
        }
    } else {
        for (let asset of poolData.pool_liquidity) {
            // Extract the token's denom and amount.
            let denom = asset.denom;
            let assetAmount = asset.amount;
    
            // Calculate the amount of this token that corresponds to the given amount of pool shares.
            tokenAmounts[denom] = (gammAmount * assetAmount) / totalShares;
        }
    }

    return tokenAmounts;
}

module.exports = {
    timetravel: false,
    methodology: "Total TVL on vaults",
    terra: {
        tvl: () => 0
    },
    osmosis: {
        tvl,
    },
    hallmarks: [
        [1651881600, "UST depeg"],
        [Math.floor(new Date('2022-09-13') / 1e3), 'Stop supporting Terra Classic'],
    ],
}
