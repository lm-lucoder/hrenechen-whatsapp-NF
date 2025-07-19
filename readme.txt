PARA O APLICATIVO FUNCIONAR, É NECESSÁRIO REALIZAR CERTAS AÇÕES:

=========== A INSTALAÇÃO DO ORACLE INSTANT CLIENT: =========== 

O oracle instant client é uma biblioteca que será utilizada pelo nosso módulo "oracledb"

== Guia do Linux:


1 (DOWNLOAD DO CLIENT): Baixe o oracle instant client. 
    Download neste link: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html

2 (INSTALE): Extraia os arquivos para uma pasta considerada segura. Recomendo o seguinte diretório:
    /usr/local/lib/instantclient

3 (CONFIGURE A VARIAVEL DE AMBIENTE): Adicione o caminho escolhido  à variável de ambiente $LD_LIBRARY_PATH
    Faça isso executando o seguinte comando:
        LD_LIBRARY_PATH=/usr/local/lib/instantclient
        export LD_LIBRARY_PATH

4 (CONFIGURE O LDCONFIG): 
    4.1: abra o arquivo de configuração ld.so.conf Você pode fazer isso com o sudo:
            sudo nano /etc/ld.so.conf
    4.2: adicione o caminho para as bibliotecas:
        /usr/local/lib/instantclient
    4.3 salve e saia

5 (ATUALIZE O CACHE):
   Atualize o cache do ldconfig com o seguinte comando:
         sudo ldconfig

6 (REINICIE O SERVIDOR)

--
Tudo deve estar configurado agora. O npm-oracledb deverá ter acesso aos arquivos necessários para que a aplicação rode corretamente.

Caso tenha mais problemas, cheque a documentação do npm-oracledb:
    https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html#oracleclientloadinglinux



=========== A ALTERAÇÃO MANUAL DO PUPPETEER (Em caso da máquina ser um contâiner docker) ===========

1: Após fazer o NPM Install abra o seguinte arquivo:
    node_modules/puppeteer/lib/cjs/puppeteer/node/Launcher.js

2: Neste arquivo, procure a sessão que irá definir os chromeArguments. Eles costumam ficar ao redor da linha 147

3: adicione a seguinte string ao chromeArguments: 
    '--no-sandbox'

4: Salve o arquivo e reinicie o projeto

5: Vualá!