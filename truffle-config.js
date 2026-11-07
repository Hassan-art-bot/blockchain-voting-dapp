module.exports = {
  networks: {
    // Ganache GUI default: 127.0.0.1:7545  (Ganache CLI default is 8545)
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
  },

  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: { enabled: false, runs: 200 },
        evmVersion: "london", // safest for Ganache
      },
    },
  },
};
