# 📦 Sistema de Gestão de Tabacaria (PDV)

Um sistema completo de Ponto de Venda (PDV) e Gestão de Estoque, desenvolvido com arquitetura MVC para atender às necessidades de uma tabacaria. O projeto gerencia desde o fluxo de caixa diário e controle de estoque até relatórios gerenciais, utilizando autenticação segura e diferentes níveis de permissão (RBAC).

## 🚀 Funcionalidades Principais

* **Controle de Acesso por Cargos (RBAC):** Permissões dinâmicas para diferentes perfis (Gerente, Supervisor e Caixa).
* **Gestão de Produtos e Estoque:** Cadastro completo de itens com upload de imagens diretamente para a nuvem (Cloudinary). Inclui alertas automáticos para produtos com estoque abaixo do mínimo.
* **Módulo de Vendas (PDV):** Registro rápido de transações com baixa atômica no estoque e suporte a múltiplos métodos de pagamento.
* **Controle de Caixa:** Abertura, fechamento e conferência do saldo do dia para garantir a segurança financeira do expediente.
* **Dashboard e Relatórios:** Geração de dados quantitativos, como volume de vendas por período, produtos mais vendidos e cálculo de lucro estimado (restrito a gerentes).

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) - Performance e componentização.
* Axios - Integração com a API.
* React Toastify - Feedbacks visuais ao usuário.

**Backend:**
* [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) - Criação da API RESTful.
* [MongoDB](https://www.mongodb.com/) + Mongoose - Banco de dados NoSQL para flexibilidade de esquemas.
* JSON Web Token (JWT) + Bcryptjs - Autenticação stateless e criptografia de senhas.
* Cloudinary + Multer - Armazenamento otimizado de imagens de produtos.

## ⚙️ Arquitetura do Sistema

O backend foi desenhado focando em segurança e separação de responsabilidades:
1. **Rotas (Routes):** Recebem a requisição HTTP.
2. **Middlewares:** Verificam o token JWT, validam a permissão do cargo (`autorizar`) e limpam os dados de entrada.
3. **Controllers:** Executam as regras de negócio (ex: impedir venda se o estoque for zero).
4. **Models:** Interagem diretamente com o MongoDB.

---

## 💻 Como rodar o projeto localmente

### 1. Pré-requisitos
* Node.js instalado (v16 ou superior)
* Conta no MongoDB Atlas (ou MongoDB rodando localmente)
* Conta no Cloudinary (para upload de imagens)

### 2. Configurando o Backend

Navegue até a pasta do servidor e instale as dependências:
```bash
cd backend
npm install