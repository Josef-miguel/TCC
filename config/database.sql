CREATE DATABASE TCC

-- Tabela USUARIO
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    tipo VARCHAR(50),
    idOrganizador INT,
    idPagamento INT
);

-- Tabela ORGANIZADOR
CREATE TABLE Organizador (
    id_organizador INT AUTO_INCREMENT PRIMARY KEY,
    nome_empresa VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    descricao TEXT,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- Atualiza a FK de Usuario pra apontar pra Organizador
ALTER TABLE Usuario
ADD CONSTRAINT fk_usuario_organizador
FOREIGN KEY (idOrganizador) REFERENCES Organizador(id_organizador);

-- Tabela EVENTO
CREATE TABLE Evento (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    destino VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_de_saida DATE NOT NULL,
    data_de_retorno DATE NOT NULL,
    local_saida VARCHAR(255) NOT NULL,
    n_vagas INT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    idOrganizador INT,
    FOREIGN KEY (idOrganizador) REFERENCES Organizador(id_organizador)
);

-- Tabela RESERVA
CREATE TABLE Reserva (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50),
    data_de_reserva DATE NOT NULL,
    id_usuario INT,
    id_evento INT,
    idPagamento INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_evento) REFERENCES Evento(id_evento)
);

-- Tabela PAGAMENTO
CREATE TABLE Pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    valor DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    status VARCHAR(50),
    data_pagamento DATE,
    id_reserva INT,
    FOREIGN KEY (id_reserva) REFERENCES Reserva(id_reserva)
);

-- Atualiza FK em Reserva e Usuario
ALTER TABLE Reserva
ADD CONSTRAINT fk_reserva_pagamento
FOREIGN KEY (idPagamento) REFERENCES Pagamento(id_pagamento);

ALTER TABLE Usuario
ADD CONSTRAINT fk_usuario_pagamento
FOREIGN KEY (idPagamento) REFERENCES Pagamento(id_pagamento);

-- Tabela AVALIACAO
CREATE TABLE Avaliacao (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    nota INT NOT NULL,
    comentario TEXT,
    data_avaliacao DATE,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- Tabela CHAT/SUPORTE
CREATE TABLE ChatSuporte (
    id_mensagem INT AUTO_INCREMENT PRIMARY KEY,
    mensagem TEXT NOT NULL,
    data DATE,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);
