# Typescript Blockchain Proof of Work

Bu proje, ITopkapıÜniversitesi Bilgisayar Programcılığı bölümü 2022-2023 Bahar dönemi dersi olan "Veri Yapıları" dersi için hazırlanmıştır.

## Proje Hakkında

Bu proje, bir blockchain oluşturmak için gerekli olan Proof of Work algoritmasını Typescript ile yazmaktadır. Içerisinde;

- Proof of Work
- Merkle Tree
- RPC Server
- Prime256v1

bulundurur. Proje, Typescript ile yazılmıştır. Proje, RPC Server ile çalışmaktadır. RPC Server, JSON-RPC protokolü ile çalışmaktadır.

Istenilen istekler için, RPC Server'a istek atılabilir. Örnek istekler, `src/client.ts` dosyasında bulunmaktadır.

Bloklar `./blocks` dizininde saklanmaktadır.

## Kullanılan Kütüphaneler

- [elliptic](https://www.npmjs.com/package/elliptic)
- [crypto-js](https://www.npmjs.com/package/crypto-js)

## Nasıl Çalıştırılır?

Öncelikle projeyi klonlayın.

```bash
git clone
```

Daha sonra projeyi çalıştırın.

```bash
yarn
yarn start-server
```

## RPC Server'a İstek Atmak

RPC Server'a istek atmak için, `src/client.ts` dosyasını kullanabilirsiniz.

```bash
yarn start-client
```

## Referanslar

- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf)
- [Bitcoin Wiki](https://en.bitcoin.it/wiki/Main_Page)
- [Bitcoin Developer Reference](https://bitcoin.org/en/developer-reference)
