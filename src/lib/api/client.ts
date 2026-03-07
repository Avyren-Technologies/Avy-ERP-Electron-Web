import axios from 'axios';

export const client = axios.create({
    timeout: 10000,
    headers: {
        Accept: 'application/json',
    },
});
