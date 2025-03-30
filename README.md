Caio Cézar Oliveira Silva
Filipe Santos Lima
Luiz Augusto Mendes Barbosa
# Sistema de Gerenciamento Clínico (Frontend)

Uma aplicação web abrangente para gerenciamento clínico, agendamento de exames médicos, gerenciamento de pacientes e acompanhamento de resultados de exames.

## Visão Geral

Esta aplicação web fornece uma interface para o gerenciamento de uma instalação clínica, incluindo:
- Cadastro e gerenciamento de clientes/pacientes
- Cadastro e gerenciamento de equipe médica
- Gerenciamento de exames médicos
- Agendamento de exames
- Registro e acompanhamento de resultados de exames
- Suporte a operações offline e sincronização posterior

## Funcionalidades

### Autenticação de Usuários
- Sistema de login para membros da equipe
- Autenticação baseada em token JWT
- Gerenciamento de sessão com verificação automática
- Logout seguro

### Gerenciamento de Clientes
- Cadastro de novos clientes
- Visualização e edição de detalhes de clientes
- Acompanhamento do histórico de exames do cliente
- Exclusão de registros de clientes

### Gerenciamento de Equipe Médica
- Cadastro de novos profissionais médicos
- Visualização dos exames atribuídos a cada médico
- Edição e exclusão de registros médicos

### Gerenciamento de Exames
- Criação e gerenciamento de tipos de exames
- Visualização detalhada de exames
- Listagem dos exames por cartões na página inicial
- Edição e exclusão de tipos de exames

### Agendamento de Exames
- Interface intuitiva para agendamento
- Seleção de cliente, médico e tipo de exame
- Verificação de disponibilidade de horários
- Visualização de agendamentos nas páginas de detalhes de médicos e clientes

### Registro de Resultados
- Registro de resultados para exames realizados
- Edição e remoção de resultados

### Recursos Offline
- Detecção automática do estado de conexão
- Armazenamento de operações pendentes quando offline
- Sincronização automática quando a conexão é restaurada
- Interface dedicada para gerenciar operações pendentes
- Contagem visual de operações pendentes no cabeçalho

## Arquitetura do Projeto

### Tecnologias Utilizadas
- **HTML5/CSS3** - Estrutura e estilização do frontend
- **JavaScript** - Funcionalidade do lado do cliente
- **Bootstrap 5** - Framework de UI responsivo
- **Axios** - Cliente HTTP para requisições à API
- **Material Icons** - Biblioteca de ícones para a interface
- **Cache API** - Para armazenamento e gerenciamento de cache

### Estrutura do Projeto
```
clinical-manager-front/
├── assets/
│   ├── css/
│   │   ├── app.css       # Estilos principais da aplicação
│   │   └── auth.css      # Estilos de autenticação
│   ├── js/
│   │   ├── api.js        # Funções de comunicação com a API e cache
│   │   ├── app.js        # Funções principais e utilitárias
│   │   ├── forms.js      # Validação e manipulação de formulários
│   │   ├── index.js      # Funcionalidades da página inicial/exames
│   │   └── SchedulesTable.js # Componente de agendamentos
│   └── imgs/             # Recursos de imagem e carrossel
├── auth/
│   └── login.html        # Página de autenticação
├── clientes/
│   ├── list.html         # Listagem de clientes
│   └── detalhes.html     # Detalhes do cliente
├── medicos/
│   ├── list.html         # Listagem de médicos
│   └── detalhes.html     # Detalhes do médico
├── exames/
│   ├── agendar.html      # Agendamento de exames
│   ├── agendamento.html  # Detalhes do agendamento
│   ├── detalhes.html     # Detalhes do exame
│   └── result.html       # Resultados do exame
├── offline/              # Gerenciamento de estado offline
│   └── index.html        # Interface de operações pendentes
└── index.html            # Página inicial e listagem de exames
```

### Comunicação com a API
O frontend se comunica com uma API backend via endpoints RESTful usando Axios. Os endpoints da API são definidos em `assets/js/api.js` e incluem:

- Autenticação (login/logout)
- Gerenciamento de clientes (operações CRUD)
- Gerenciamento de médicos (operações CRUD)
- Gerenciamento de exames (operações CRUD)
- Agendamentos de exames
- Registro e recuperação de resultados

### Sistema de Cache e Operações Offline
- Cache de dados para melhor desempenho e uso offline
- Detecção automática do estado de conexão
- Armazenamento local de operações pendentes
- Sistema de sincronização quando a conexão é restaurada
- Interface para visualizar e gerenciar operações pendentes

## Configuração e Instalação

1. Clone o repositório:
```
git clone https://github.com/LuizzzM/clinica
```

2. Abra o projeto em seu editor de código preferido

3. A aplicação foi projetada para funcionar com uma API backend rodando em `http://3.132.228.81/api/`. Certifique-se de que o backend esteja em execução ou atualize o API_URL em `assets/js/api.js` se estiver hospedado em outro local.

4. Para executar localmente, você pode usar qualquer navegador, abrindo o arquivo index.html ou servidor local, como a extensão Live Server do VSCode.

## Uso

1. Abra a aplicação em um navegador web
2. Faça login com as credenciais teste@example.com:password
3. Navegue usando o menu superior para:
   - Gerenciar clientes
   - Gerenciar médicos
   - Visualizar e agendar exames

## Detalhes Técnicos

### Fluxo de Autenticação
- Usuário envia credenciais de login
- Backend valida e retorna token JWT
- Token é armazenado no localStorage
- Token é incluído em todas as requisições subsequentes à API
- Requisições não autorizadas redirecionam para a página de login

### Gerenciamento de Dados

- Todos os dados são buscados e armazenados na API backend
- Sistema de cache para operações GET frequentes
- Validações de formulário garantem a integridade dos dados
- Tratamento de erros com feedback visual ao usuário
- Suporte a operações offline com fila de sincronização

### Design Responsivo
- Interface totalmente adaptável a diferentes dispositivos
- Layout otimizado para desktop e dispositivos móveis
- Componentes de UI responsivos com Bootstrap 5
- Carregamento otimizado de imagens para diferentes resoluções

### Recursos de Acessibilidade
- Estrutura semântica HTML5
- Atributos ARIA para melhor navegação por leitores de tela
- Feedback visual e textual para ações do usuário
- Contraste adequado para melhor legibilidade

## Recursos Utilizados

- [Bootstrap 5](https://getbootstrap.com/docs/5.3/getting-started/introduction/) - Framework de UI responsivo
- [Axios](https://axios-http.com/docs/intro) - Cliente HTTP baseado em promessas
- [Material Icons](https://fonts.google.com/icons) - Conjunto de ícones
- [Google Fonts](https://fonts.google.com/) - Tipografia web
- [LocalStorage API](https://developer.mozilla.org/pt-BR/docs/Web/API/Window/localStorage) - Armazenamento local

## Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo LICENSE para obter detalhes.