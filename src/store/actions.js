
//storing connection to web 3
export function web3Loaded(connection) {
    return {
        type: 'WEB3_LOADED',
        connection
    }
}

export const web3AccountLoaded = (account) => {
    return {
        type: 'WEB3_ACCOUNT_LOADED',
        account
    }
}

//loading token contract
export const tokenLoaded = (contract) => {
    return {
        type: 'TOKEN_LOADED',
        contract
    }
}

//loading exchange contract
export const exchangeLoaded = (contract) => {
    return {
        type: 'EXCHANGE_LOADED',
        contract
    }
}