'use strict';

const pages = [];
const contracts = {};

const screener = [];

const imgBaseUrl = 'https://raw.githubusercontent.com/smartcontractkit/documentation/main/public';

let web3 = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initialize();

  web3 = {};

  Object.keys(NETWORK).forEach((network) => {
    if (NETWORK[network].rpc.length > 0) {
      web3[network] = new Web3(NETWORK[network].rpc);
    }
  });
});

const initialize = async () => {
  await fetchPages();

  await updateMain();

  await initializeScreener();

  updatePrice();
};

const initializeScreener = async () => {
  for(const item of SCREENER_INITIALIZER) {
    addToScreener(item)
  }
}

const updateMain = async () => {
  const main = document.getElementById('main');

  for (const page of pages) {
    for (const network of page.networks) {
      const networkId = page.page + '-' + network.name.toLowerCase().replaceAll(' ', '-');
      contracts[networkId] = await fetchContracts(network.rddUrl);
      contracts[networkId].forEach((contract) => {
        const prefix = definePrefix(contract.path)
        if(prefix && prefix !== contract.valuePrefix) contract.valuePrefix = prefix
        contract.networkId = networkId
      });

      const section = document.createElement('section');
      main.appendChild(section);
      const h2 = document.createElement('h2');
      const img = document.createElement('img');
      img.src = imgBaseUrl + page.img;
      img.alt = page.label;
      const spanH2 = document.createElement('span');
      spanH2.innerHTML = network.networkType === 'mainnet' ? network.name : page.label + ' - ' + network.name;
      h2.appendChild(img);
      h2.appendChild(spanH2);
      section.appendChild(h2);

      const ul = document.createElement('ul');
      section.appendChild(ul);

      for (const contract of contracts[networkId]) {
        const li = document.createElement('li');
        const divName = document.createElement('div');
        divName.classList.add('name');
        divName.innerHTML = contract.name;
        li.appendChild(divName);

        const divAsset = document.createElement('div');
        divAsset.classList.add('asset');
        divAsset.innerHTML = contract.docs?.assetName ?? '';
        li.appendChild(divAsset);

        const divType = document.createElement('div');
        divType.classList.add('type');
        divType.innerHTML = contract.docs?.feedType ?? '';
        li.appendChild(divType);

        const divThreshold = document.createElement('div');
        divThreshold.classList.add('threshold');
        divThreshold.innerHTML = contract.threshold + '%';
        li.appendChild(divThreshold);

        const divHeartbeat = document.createElement('div');
        divHeartbeat.classList.add('heartbeat');
        divHeartbeat.innerHTML = contract.heartbeat + 's';
        li.appendChild(divHeartbeat);

        li.id = networkId + '+' + contract.path;
        li.addEventListener('click', addToScreener);
        ul.appendChild(li);
      }
    }
  }
}

const updateScreener = () => {
  const ul = document.getElementById('screener');

	if(ul.children.length) {
		Array.from(ul.children).forEach((li) => {
      if(!isInScreener(li.id)) li.remove()
		})
	}
  // ul.innerHTML = null;

  screener.forEach((contract) => {
    let li = document.getElementById('screener' + contract.networkId + '+' + contract.path);
    if (!li) {
      const li = document.createElement('li');
      const divName = document.createElement('div');
      divName.classList.add('name');
      divName.innerHTML = contract.assetName;

      const divDate = document.createElement('div');
      divDate.classList.add('date');
      divDate.id = contract.networkId + '+' + contract.path + 'date';
      if (contract.timestamp)
      divDate.innerHTML = (new Date(contract.timestamp)).toLocaleString();

      const divPrice = document.createElement('div');
      divPrice.classList.add('price');
      divPrice.id = contract.networkId + '+' + contract.path + 'price';
      if (contract.price)
      divPrice.innerHTML = contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals));

      li.id = 'screener' + contract.networkId + '+' + contract.path;
      li.addEventListener('click', removeFromScreener);
      li.appendChild(divName);
      li.appendChild(divPrice);
      li.appendChild(divDate);
      ul.appendChild(li);
    } else {
      let price = document.getElementById(contract.networkId + '+' + contract.path + 'price');
      if(price) price.innerHTML = contract.price ? contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals)) : '';
      let date = document.getElementById(contract.networkId + '+' + contract.path + 'date');
      if(date) date.innerHTML = contract.timestamp ? (new Date(contract.timestamp)).toLocaleString() : '';
    }
  });
};

const updateScreenerByContract = (contract) => {
  let price = document.getElementById(contract.networkId + '+' + contract.path + 'price');
  if(price) price.innerHTML = contract.price ? contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals)) : '';
  let date = document.getElementById(contract.networkId + '+' + contract.path + 'date');
  if(date) date.innerHTML = contract.timestamp ? (new Date(contract.timestamp)).toLocaleString() : '';
}

const updatePrice = () => {
  let delay = 2500;
  if(screener.length > 0) {
    const contractToUpdate = screener.find((contract) => Date.now() - contract.updatedAt > 7500 || !contract.updatedAt)
    if(contractToUpdate) {
      delay = 250 + Math.floor(250 * Math.random())

      let web3 = getWeb3(contractToUpdate.networkId)
    	if(web3) {
    		try {
          contractToUpdate.updatedAt = Date.now()
          getLatestRoundWeb3(contractToUpdate.contractAddress, contractToUpdate.networkId).then(latestRoundData => {
            contractToUpdate.price = latestRoundData.answer//web3.utils.fromWei(latestRoundData.answer, 'ether')
            contractToUpdate.timestamp = Number(latestRoundData.updatedAt + "000")

            updateScreenerByContract(contractToUpdate)
        	}, error => {
        		console.log(error)
        	})
    		} catch {}
    	}
    }
  }

  setTimeout(updatePrice, delay);
}

const addToScreener = (e) => {
  if (!e.target?.id && e.target?.parentElement) e = e.target.parentElement;
  if (e.target?.id) e = e.target;

  if (isInScreener(e.id)) return;

  screener.push(searchContract(e.id));
  updateScreener();
};

const removeFromScreener = (e) => {
  if (!e.target.id) e = e.target.parentElement;

  if (isInScreener(e.id)) {
    screener.splice(
      screener.findIndex(
        (contract) => e.id.split('+')[0].includes(contract.networkId) && contract.path === e.id.split('+')[1]
      ),
      1
    );
    updateScreener();
  }
};

const isInScreener = (id) => {
  return (
    screener.filter(
      (contract) => id.split('+')[0].includes(contract.networkId) && contract.path === id.split('+')[1]
    ).length > 0
  );
};

const searchContract = (id) => {
  return contracts[id.split('+')[0]].find((contract) => contract.path === id.split('+')[1]);
};

const fetchPages = async () => {
  const list = await fetch(
    'https://raw.githubusercontent.com/dorianbayart/documentation/main/src/features/feeds/data/chains.ts'
  )
  .then((resp) => resp.text())
  .then((text) => text.split('CHAINS: Chain[] =').slice(-2)[0].split('export')[0]) // keep useful data
  .then((str) =>
  ('{ data:' + str + '}')
  .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
  .replaceAll('https": ', 'https:')
  .replace(/\,(?!\s*?[\{\[\"\'\w])/g, '')
)
.then(JSON.parse)
.then((json) => json.data);

pages.push(...list);
};

const fetchContracts = async (url) => {
  const data = await fetch(url)
  .then((resp) => resp.text())
  .then(JSON.parse)
  .then((array) => array.sort((a, b) => a.name.localeCompare(b.name)));
  return data;
};

/* Utils - Round a price */
const roundPrice = (price) => {
  if(price < 0.01) return Math.round(price * 1000000) / 1000000
  if(price < 1) return Math.round(price * 10000) / 10000
  if(price < 10) return Math.round(price * 1000) / 1000
  if(price < 1000) return Math.round(price * 100) / 100
  if(price < 10000) return Math.round(price * 10) / 10
  return Math.round(price)
}

const definePrefix = (path) => {
  const key = Object.keys(SYMBOLS).find(key => path.endsWith(key))
  if(key) return SYMBOLS[key]
  return
}

/* Utils - Return the web3 to use depending on the network */
const getWeb3 = (network) => {
  if(web3) return web3[network]
  return
}

// Get token balance
const getLatestRoundWeb3 = async (adress, network) => {
	let contract = new (getWeb3(network).eth).Contract(ABI, adress)
	return await contract.methods.latestRoundData().call(async (error, value) => {
		return value
	})
}
