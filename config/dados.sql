-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.1.33-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win32
-- HeidiSQL Versão:              9.5.0.5196
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Copiando estrutura do banco de dados para tcc
CREATE DATABASE IF NOT EXISTS `tcc` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `tcc`;

-- Copiando estrutura para tabela tcc.alembic_version
CREATE TABLE IF NOT EXISTS `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.alembic_version: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.avaliacao
CREATE TABLE IF NOT EXISTS `avaliacao` (
  `id_avaliacao` int(11) NOT NULL AUTO_INCREMENT,
  `nota` int(11) NOT NULL,
  `comentario` text,
  `data_avaliacao` date DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_avaliacao`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `avaliacao_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.avaliacao: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `avaliacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `avaliacao` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.chatsuporte
CREATE TABLE IF NOT EXISTS `chatsuporte` (
  `id_mensagem` int(11) NOT NULL AUTO_INCREMENT,
  `mensagem` text NOT NULL,
  `data` date DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_mensagem`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `chatsuporte_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.chatsuporte: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `chatsuporte` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatsuporte` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.evento
CREATE TABLE IF NOT EXISTS `evento` (
  `id_evento` int(11) NOT NULL AUTO_INCREMENT,
  `destino` varchar(255) NOT NULL,
  `descricao` text,
  `data_de_saida` date NOT NULL,
  `data_de_retorno` date NOT NULL,
  `local_saida` varchar(255) NOT NULL,
  `n_vagas` int(11) NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `n_favoritos` int(11) DEFAULT NULL,
  `n_acessos` int(11) DEFAULT NULL,
  `id_organizador` int(11) DEFAULT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evento`),
  KEY `fk_evento_organizador` (`id_organizador`),
  CONSTRAINT `fk_evento_organizador` FOREIGN KEY (`id_organizador`) REFERENCES `organizador` (`id_organizador`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.evento: ~1 rows (aproximadamente)
/*!40000 ALTER TABLE `evento` DISABLE KEYS */;
INSERT INTO `evento` (`id_evento`, `destino`, `descricao`, `data_de_saida`, `data_de_retorno`, `local_saida`, `n_vagas`, `preco`, `n_favoritos`, `n_acessos`, `id_organizador`, `data_criacao`) VALUES
	(1, 'Cananeia', 'Viagem inesquecivel para uma cidade parasisiaca', '2025-06-24', '2025-12-24', 'Registro', 40, 50.00, 67, 23, 1, '2025-06-24 10:27:12');
/*!40000 ALTER TABLE `evento` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.favoritos
CREATE TABLE IF NOT EXISTS `favoritos` (
  `id_favorito` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_evento` int(11) DEFAULT NULL,
  `data_adicionado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_favorito`),
  UNIQUE KEY `id_usuario` (`id_usuario`,`id_evento`),
  KEY `id_evento` (`id_evento`),
  CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.favoritos: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `favoritos` DISABLE KEYS */;
/*!40000 ALTER TABLE `favoritos` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.organizador
CREATE TABLE IF NOT EXISTS `organizador` (
  `id_organizador` int(11) NOT NULL AUTO_INCREMENT,
  `nome_empresa` varchar(255) NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `endereco` varchar(255) NOT NULL,
  `descricao` text,
  `id_usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_organizador`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `organizador_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.organizador: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `organizador` DISABLE KEYS */;
INSERT INTO `organizador` (`id_organizador`, `nome_empresa`, `cnpj`, `endereco`, `descricao`, `id_usuario`) VALUES
	(1, 'JustSetGo', '55.555.555/5555-55', 'Rua Golçaves', 'Empresa de viagens para pessoas interessadas.', 6),
	(2, 'JustSetGo', '55.555.555/5555-55', 'Rua Golçaves', 'Minha empresa faz excursões para o show do Barões da Pisadinha.', 9);
/*!40000 ALTER TABLE `organizador` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.pagamento
CREATE TABLE IF NOT EXISTS `pagamento` (
  `id_pagamento` int(11) NOT NULL AUTO_INCREMENT,
  `valor` decimal(10,2) NOT NULL,
  `metodo_pagamento` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `data_pagamento` date DEFAULT NULL,
  `id_reserva` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_pagamento`),
  KEY `id_reserva` (`id_reserva`),
  CONSTRAINT `pagamento_ibfk_1` FOREIGN KEY (`id_reserva`) REFERENCES `reserva` (`id_reserva`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.pagamento: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `pagamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagamento` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.reserva
CREATE TABLE IF NOT EXISTS `reserva` (
  `id_reserva` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(50) DEFAULT NULL,
  `data_de_reserva` date NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `id_evento` int(11) DEFAULT NULL,
  `idPagamento` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_evento` (`id_evento`),
  KEY `fk_reserva_pagamento` (`idPagamento`),
  CONSTRAINT `fk_reserva_pagamento` FOREIGN KEY (`idPagamento`) REFERENCES `pagamento` (`id_pagamento`),
  CONSTRAINT `reserva_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `reserva_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.reserva: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `reserva` DISABLE KEYS */;
/*!40000 ALTER TABLE `reserva` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `senha` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.usuario: ~6 rows (aproximadamente)
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` (`id_usuario`, `nome`, `email`, `telefone`, `senha`, `cpf`, `tipo`) VALUES
	(1, 'Administrador', 'admin@setjustgo.com', NULL, 'scrypt:32768:8:1$7NZt72yC6CfLsmIo$782da21a422693504cb2ebae368897542dd343525dee7d92e330855bb7103312d774ff2461da51afafd2dec8ac745eb8c963e742d8adf39b92d7956402428051', '000.000.000-00', 'admin'),
	(2, 'Rafael Ferrete', 'rafaelferrete333@gmail.com', '(13) 99761-7510', 'scrypt:32768:8:1$ESNveot8FrFw5DW7$71caf1aafe0153b9f4066a63883557e43a95544e14afbb4977916dc67c4378df54fe1db851b85e92a7fa64dec9ae3a43e8900b71ac63963c51fa7d1822731cbc', '516.382.178-40', 'usuario'),
	(3, 'Xbox One', 'maria.silva@email.com', '13997617510', 'scrypt:32768:8:1$8HnFV9K0v8AEYP6W$5b905a873ad467ef61747546ebc15ddd9edfaa9e39d9da8a6f501eeebebe9ca366c2422968aa9fe5895ace163917b948cc90f3333ac6d15e6c3e6d90660f4617', '51638217840', 'usuario'),
	(4, 'telles', 'teles@gmail.com', '13997670809', 'scrypt:32768:8:1$UgatLoNarR49e9qZ$f15a9b8047720f6fc85d3109e9e625f0d2b0573cac5579830b00c41d446fcfe454485ad667efa9c527bc193999b2949073ebe79607799880074cae9dea83bae2', '47474457530', 'usuario'),
	(5, 'miguel juse', 'jusemiguel@gmail.com', '13997617510', 'scrypt:32768:8:1$vU40YLzmqz6wMCLM$2a62f0f6c9cb972963462095facf8d95e3e84f76f569af8455d830772ff6c13918b69f5d55ae5bfaf21d288a7cdefc496da577184e92c35a41bb76402c423891', '51638217840', 'usuario'),
	(6, 'Rafael Ferrete', 'iuhyuheuye@gmail.com', '(13) 99761-7510', 'scrypt:32768:8:1$vTBlLAn1AG2Lh7Nn$1626c3d52fb69efbf5b7371b9253f49434989eee22aa9724aa364aa8a8fb8fa8db829190f427e16c4c4d7a83603d2d30fb740b9ee5044a9d322857003503575c', '516.382.178-40', 'organizador'),
	(9, 'Rafael Ferrete', 'seila@gmail.com', '13997617510', 'scrypt:32768:8:1$p0MO8GO0lmoGawhv$5c374a41c299aa4acebe8759b0fc6e4f537a43098fece17689b9ad33e0a39f206c55b66efe0c1e04ad952917db0cccf55ada7fadc43bebd791e4a5a4b07e6107', '516.382.178-40', 'organizador'),
	(10, 'Seila Da Silva', 'sei@gmail.com', '13997617510', 'scrypt:32768:8:1$42CrJ9yURyDNOCtu$53233ad9e881eaa967db8c663e8348efe94359c0b422ef1809cd9b11496a2c2eb3cb36b44b025d6c122099be8a8de829f24ec2a35395be3e6c1476136beb4a4d', '516.382.178-40', 'usuario');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
