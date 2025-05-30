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
  `destino` varchar(255) DEFAULT NULL,
  `descricao` mediumtext,
  `data_de_saida` date NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `data_de_retorno` date NOT NULL,
  `local_saida` varchar(255) DEFAULT NULL,
  `imagens` text,
  `n_vagas` int(11) NOT NULL DEFAULT '0',
  `preco` decimal(10,2) NOT NULL,
  `id_organizador` int(11) DEFAULT NULL,
  `avaliacao` int(11) DEFAULT NULL,
  `numLikes` int(11) DEFAULT NULL,
  `id_tag` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `id_tag` (`id_tag`),
  KEY `id_organizador` (`id_organizador`),
  CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`id_tag`) REFERENCES `tags` (`id_tag`),
  CONSTRAINT `evento_ibfk_2` FOREIGN KEY (`id_organizador`) REFERENCES `organizador` (`id_organizador`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4;

-- Copiando dados para a tabela tcc.evento: ~5 rows (aproximadamente)
/*!40000 ALTER TABLE `evento` DISABLE KEYS */;
INSERT INTO `evento` (`id_evento`, `destino`, `descricao`, `data_de_saida`, `titulo`, `data_de_retorno`, `local_saida`, `imagens`, `n_vagas`, `preco`, `id_organizador`, `avaliacao`, `numLikes`, `id_tag`) VALUES
	(9, 'Chapada Diamantina', 'Uma aventura nas trilhas e cachoeiras da Chapada.', '2025-07-15', 'Trilhas da Chapada', '2025-07-20', 'Salvador - BA', 'https://th.bing.com/th/id/OIP.VpvRjDOPXLcEZemuQ2NEDQHaEK?rs=1&pid=ImgDetMain', 20, 1499.99, 1, 5, 120, 1),
	(10, 'Ouro Preto', 'Viagem cultural explorando o barroco mineiro.', '2025-08-10', 'Barroco Mineiro', '2025-08-15', 'Belo Horizonte - MG', 'https://th.bing.com/th/id/OSK.HEROdjlzP4ZaOxQdzR4uDXq37mcqO4uLQ1n0vUuU6IXOD84?w=472&h=280&c=1&rs=2&o=6&pid=SANGAM', 35, 999.50, 1, 4, 85, 1),
	(11, 'Foz do Iguaçu', 'Tour de 3 dias com hotel e ingressos para as cataratas.', '2025-10-05', 'Cataratas do Iguaçu', '2025-10-08', 'Curitiba - PR', 'https://th.bing.com/th/id/R.b27cb2a855f7e257aef64490b4ee3c95?rik=8E%2bmhAScK57nNg&pid=ImgRaw&r=0', 1, 550.00, 1, 5, 200, 1),
	(12, 'Amazonas', 'Aventura na floresta Amazônica.', '2025-11-01', 'Exploração na Amazônia', '2025-11-07', 'Manaus - AM', 'https://th.bing.com/th/id/OSK.fpEpBqfOaHdNtPzXxrjkl9yRJ3pAbaYZPewjGcM66FU?w=130&h=100&c=8&o=6&pid=SANGAM', 50, 15000.00, 1, 5, 300, 1);
/*!40000 ALTER TABLE `evento` ENABLE KEYS */;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.organizador: ~1 rows (aproximadamente)
/*!40000 ALTER TABLE `organizador` DISABLE KEYS */;
INSERT INTO `organizador` (`id_organizador`, `nome_empresa`, `cnpj`, `endereco`, `descricao`, `id_usuario`) VALUES
	(1, 'etec', '1111111', '12132', '1556', 12);
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

-- Copiando estrutura para tabela tcc.tags
CREATE TABLE IF NOT EXISTS `tags` (
  `id_tag` int(11) NOT NULL AUTO_INCREMENT,
  `nome_tag` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_tag`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.tags: ~3 rows (aproximadamente)
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` (`id_tag`, `nome_tag`) VALUES
	(1, 'Viagem'),
	(2, 'Excursão'),
	(3, 'Show');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;

-- Copiando estrutura para tabela tcc.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `senha` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `idOrganizador` int(11) DEFAULT NULL,
  `idPagamento` int(11) DEFAULT NULL,
  `dataNasc` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  KEY `fk_usuario_organizador` (`idOrganizador`),
  KEY `fk_usuario_pagamento` (`idPagamento`),
  CONSTRAINT `fk_usuario_organizador` FOREIGN KEY (`idOrganizador`) REFERENCES `organizador` (`id_organizador`),
  CONSTRAINT `fk_usuario_pagamento` FOREIGN KEY (`idPagamento`) REFERENCES `pagamento` (`id_pagamento`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;

-- Copiando dados para a tabela tcc.usuario: ~24 rows (aproximadamente)
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` (`id_usuario`, `nome`, `email`, `telefone`, `senha`, `cpf`, `tipo`, `idOrganizador`, `idPagamento`, `dataNasc`) VALUES
	(12, 'ADMIN', 'admin', NULL, 'etec-2325', '11111111111', NULL, NULL, NULL, '0000-00-00'),
	(13, 'vt', 'vt@gmeiu.com', NULL, '12345', '12345678011', NULL, NULL, NULL, ''),
	(14, 'ze', 'ze@ze', NULL, '456', '4567212', NULL, NULL, NULL, ''),
	(15, 'ze', 'ze@ze', NULL, '456', '4567212', NULL, NULL, NULL, ''),
	(16, 'a', 'a', NULL, '4', '6666666', NULL, NULL, NULL, ''),
	(17, 'a', 'a', NULL, 'aa', '455454', NULL, NULL, NULL, ''),
	(18, 'VT', 'vt@gmail.com', NULL, '123', '12345678910', NULL, NULL, NULL, ''),
	(19, 'a', 'a', NULL, '4254', '2042424', NULL, NULL, NULL, ''),
	(20, 'carlos', 'carlos@gmfdk.com', NULL, '123', '12312312312', NULL, NULL, NULL, ''),
	(21, 'juam123', '123@123.com', NULL, '123', '12312312312', NULL, NULL, NULL, ''),
	(22, 'a', 'a', NULL, 'a', '444', NULL, NULL, NULL, ''),
	(23, 'a', 'a', NULL, 'a', '88', NULL, NULL, NULL, ''),
	(24, 'qa', 'a', NULL, 'aa', 'aa', NULL, NULL, NULL, ''),
	(25, 'a', 'a', NULL, 'aa', 'aaa', NULL, NULL, NULL, ''),
	(26, 'a', 'a', NULL, 'a', 'a', NULL, NULL, NULL, ''),
	(27, 'a', 'a', NULL, 'a', 'a', NULL, NULL, NULL, ''),
	(28, 'a', 'a', NULL, 'a', 'a', NULL, NULL, NULL, ''),
	(29, 'a', 'a', NULL, 'a', 'a', NULL, NULL, NULL, ''),
	(30, 'Davi Kirk', 'oscharkers@gmail.com', NULL, '12345678', '123456', NULL, NULL, NULL, ''),
	(31, 'a', 'a', NULL, '32', '22', NULL, NULL, NULL, ''),
	(32, 'a', 'a', NULL, '32', '22', NULL, NULL, NULL, ''),
	(33, 'VTgay', 'joseisak@gmail.com', NULL, '1239', '12312312312', NULL, NULL, NULL, ''),
	(34, '', '', NULL, '', '', NULL, NULL, NULL, ''),
	(35, '', '', NULL, '', '', NULL, NULL, NULL, '');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
