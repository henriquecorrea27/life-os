# Requisitos

O que precisa estar instalado na máquina antes de rodar o Life OS.

## Obrigatório

| Ferramenta | Versão mínima | Como checar | Onde baixar |
|---|---|---|---|
| **Node.js** | 20.x (recomendado: 22 LTS ou mais novo) | `node -v` | https://nodejs.org |
| **npm** | 10.x (vem junto com o Node) | `npm -v` | — |

Não precisa de banco de dados externo, Docker, nem conta em nenhum serviço — o banco é um arquivo SQLite local (`prisma/dev.db`), criado automaticamente pelo `npm run setup`.

## Recomendado

| Ferramenta | Para quê |
|---|---|
| **Git** | clonar o repositório e versionar mudanças |
| **GitHub CLI** (`gh`) | só se for criar/gerenciar repositórios pelo terminal |

## Windows — PowerShell

Por padrão o Windows bloqueia a execução de scripts (`.ps1`), e o `npm`/`npx` no Windows são wrappers `.ps1` — isso causa o erro `não pode ser carregado porque a execução de scripts foi desabilitada`. Resolve uma vez só, no PowerShell (não precisa ser admin):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Confirme com `S` quando perguntar. Alternativa pontual, sem mudar nada no sistema: rodar `npm.cmd` em vez de `npm` (ex.: `npm.cmd run dev`).

## Instalando e rodando

```bash
npm install                # instala as dependências do projeto
cp .env.example .env       # Windows: copy .env.example .env
npm run setup              # cria o banco SQLite e semeia as categorias
npm run dev                # inicia em http://localhost:3000
```

Depois da primeira vez, `.env` e o banco já existem — só precisa de `npm run dev` (ver README.md).

## Verificando se está tudo certo

```bash
node -v     # deve mostrar v20 ou mais novo
npm -v      # deve mostrar 10 ou mais novo
npm run build   # se terminar sem erro, o ambiente está OK
```
