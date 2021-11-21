const HDKey = libs.ED25519.default;

(function () {
  const networks = [
    {
      name: 'SOL - Solana',
      onSelect: function () {
        setHdCoin(501);
      }
    }
  ];
  let seed = null;
  let hdkey = null;
  let bip32RootKey = null;
  let bip32ExtendedKey = null;
  let seedChangedTimeoutEvent = null;

  const DOM = {};
  DOM.network = $(".network");
  DOM.phraseNetwork = $("#network-phrase");
  DOM.seed = $("#seed");
  DOM.rootKey = $("#root-key");
  DOM.bip44path = $("#bip44-path");
  DOM.bip44purpose = $("#purpose-bip44");
  DOM.bip44coin = $("#coin-bip44");
  DOM.bip44account = $("#account-bip44");
  DOM.bip44accountXprv = $("#account-xprv");
  DOM.bip44change = $("#change-bip44");
  DOM.extendedPrivKey = $("#extended-priv-key");

  function init() {
    DOM.phraseNetwork.on("change", networkChanged);
    DOM.bip44account.on("input", calcForDerivationPath);
    DOM.bip44change.on("input", calcForDerivationPath);
    DOM.seed.on("input", delayedSeedChanged);
    populateNetworkSelect();
  }

  function populateNetworkSelect() {
    for (let i=0; i < networks.length; i++) {
      const network = networks[i];
      const option = $('<option>');
      option.attr("value", i);
      option.text(network.name)
      if (network.name === "SOL - Solana") {
        option.prop("selected", true);
        network.onSelect();
      }
      DOM.phraseNetwork.append(option);
    }
  }

  function setHdCoin(coinValue) {
    DOM.bip44coin.val(coinValue);
  }

  function networkChanged(e) {
    clearDerivedKeys();
    const networkIndex = e.target.value;
    const network = networks[networkIndex];
    network.onSelect();
    if (seed !== null) {
      seedChanged();
    } else {
      rootKeyChanged();
    }
  }

  function delayedSeedChanged() {
    DOM.rootKey.val("")
    clearDerivedKeys();
    seed = null;
    if (seedChangedTimeoutEvent !== null) {
      clearTimeout(seedChangedTimeoutEvent);
    }
    seedChangedTimeoutEvent = setTimeout(seedChanged, 400);
  }

  function seedChanged() {
    seed = DOM.seed.val();
    if (seed) {
      bip32RootKey = HDKey.fromMasterSeed(seed);
      DOM.rootKey.val(bip32RootKey.privateExtendedKey);
      calcForDerivationPath();
    }
  }

  function rootKeyChanged() {
    const rootKey = DOM.rootKey.val();
    bip32RootKey = HDKey.fromExtendedKey(rootKey);
    calcForDerivationPath();
  }

  function calcForDerivationPath() {
    clearDerivedKeys();
    const derivationPath = getDerivationPath();
    bip32ExtendedKey = calculateBip32ExtendedKey(derivationPath);
    displayBip44Info();
    displayBip32Info();
  }

  function calculateBip32ExtendedKey(path) {
    if (!bip32RootKey) {
      return bip32RootKey;
    }
    let key = bip32RootKey;
    const pathBits = path.split('/');
    for (let i=0; i < pathBits.length; i++) {
      const bit = pathBits[i];
      const index = parseInt(bit);
      if (isNaN(index)) {
        continue ;
      }
      key = key.deriveChild(index);
    }
    return key;
  }

  function getDerivationPath() {
    const purpose = parseIntNoNan(DOM.bip44purpose.val(), 44);
    const coin = parseIntNoNan(DOM.bip44coin.val(), 501);
    const account = parseIntNoNan(DOM.bip44account.val(), 0);
    const change = parseIntNoNan(DOM.bip44change.val(), 0);
    let path = "m/";
    path += purpose + "'/";
    path += coin + "'/";
    path += account + "'/";
    path += change + "'";
    DOM.bip44path.val(path);
    const derivationPath = DOM.bip44path.val();
    console.log("Using derivation path from BIP44 tab: " + derivationPath);
    return derivationPath;
  }

  function parseIntNoNan(val, defaultValue) {
    const v = parseInt(val);
    if (isNaN(v)) {
      return defaultValue;
    }
    return v;
  }

  function displayBip32Info() {
    DOM.seed.val(seed);
    DOM.rootKey.val(bip32RootKey.privateExtendedKey);
    DOM.extendedPrivKey.val(bip32ExtendedKey.privateExtendedKey);
  }

  function displayBip44Info() {
    const purpose = parseIntNoNan(DOM.bip44purpose.val(), 44);
    const coin = parseIntNoNan(DOM.bip44coin.val(), 501);
    const account = parseIntNoNan(DOM.bip44account.val(), 0);
    let path = "m/";
    path += purpose + "'/";
    path += coin + "'/";
    path += account + "'/";
    const accountExtendedKey = calculateBip32ExtendedKey(path);
    DOM.bip44accountXprv.val(accountExtendedKey.privateExtendedKey);
  }

  function clearDerivedKeys() {
    DOM.bip44accountXprv.val("");
    DOM.extendedPrivKey.val("");
  }

  init();

})();
