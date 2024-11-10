# Lidhje TCP me Socket në JavaScript

Ky program përfshin një server dhe dy lloje klientësh që lidhen me të përmes protokollit TCP, duke përdorur socket-e në JavaScript. Klientët kanë të drejta të ndryshme: njëri ka qasje vetëm për lexim, ndërsa tjetri ka qasje të plotë për lexim, shkrim dhe ekzekutim të komandave në server.

## Hapat për të Ekzekutuar Programin:

### Ekzekutimi i Serverit dhe Klientëve

1. Hapni një terminal dhe lëvizni te directory i projektit me komandën:

 
    cd `<PATH>`


2. Pastaj per te ekzekutuar serverin perdorni komandën:

    `node server.js`

3. Hapni terminale të ndara, ne te cilet mund të ekzekutoni klientët me nivele të ndryshme te qasjeve:

   - Për të ekzekutuar klientin me qasje të plotë:
     
      `node fullAccessClient.js`

   - Për klientin me qasje te kufizuar:

     
      `node readClient.js`
    

## Komandat për Klientët

### Komandat për Klientin me Qasje te kufizuar

- `read [path/to/file]`: Lexon përmbajtjen e një file në server. Klienti mund te shoh permbajtjen, por nuk mund te modifikoje ate.

### Komandat për Klientin me Qasje të Plotë

- `read [path/to/file]`: Lexon përmbajtjen e një file te caktuar.
- `write [path/to/file] [content]`: Shkruan në një file të caktuar.
- `execute [command]`: Ekzekuton komanda të veçanta në server, si:
  - `see_files`: Shfaq file-s në pathin e zgjedhur.
  - `see_client_log`: Shfaq historine e klientëve që janë lidhur.
  - `delete_client_log`: Fshin historine e lidhjeve të klientëve.
  - `delete_files`: Fshin të gjithë files në pathin e zgjedhur.

## Shënime
- Serveri pranon maksimumi 4 klientë njëherësh. Nëse është i tejngarkuar, klientët e rinj duhet të provojnë përsëri më vonë.
- Çdo klient duhet të deklarojë tipin e tij të qasjes para se të dërgojë komandat.
