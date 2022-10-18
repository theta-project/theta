SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `achievements`;
CREATE TABLE `achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `achievement_name` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condition` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `admin_logs`;
CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `beatmaps`;
CREATE TABLE `beatmaps` (
  `id` int(11) NOT NULL,
  `beatmap_id` int(11) NOT NULL,
  `beatmapset_id` int(11) NOT NULL,
  `beatmap_md5` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `AR` double NOT NULL,
  `OD` double NOT NULL,
  `difficulty_std` double NOT NULL,
  `difficulty_taiko` double NOT NULL,
  `difficulty_mania` double NOT NULL,
  `difficulty_ctb` double NOT NULL,
  `max_combo` int(11) NOT NULL,
  `hit_length` int(11) NOT NULL,
  `last_updated` datetime NOT NULL,
  `playcount` int(11) NOT NULL,
  `passcount` int(11) NOT NULL,
  `ranked_status_vn` enum('unranked','ranked','loved','approved') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ranked_status_rx` enum('unranked','ranked','loved','approved') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ranked_status_ap` enum('unranked','ranked','loved','approved') COLLATE utf8mb4_unicode_ci NOT NULL,
  `pp_95` int(11) NOT NULL,
  `pp_98` int(11) NOT NULL,
  `pp_ss` int(11) NOT NULL,
  `frozen` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `channels`;
CREATE TABLE `channels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `topic` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `join_permissions` enum('banned','normal','restricted','nominator','qat','moderator','developer','admin') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `autojoin` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `channels` (`id`, `name`, `topic`, `join_permissions`, `autojoin`) VALUES
(1,	'#osu',	'The main chat channel',	'normal',	1),
(2,	'#announcements',	'Server announcements go here',	'normal',	1),
(3,	'#lobby',	'Multiplayer lobby text chat',	'normal',	0);

DROP TABLE IF EXISTS `clans`;
CREATE TABLE `clans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `flagged_scores`;
CREATE TABLE `flagged_scores` (
  `id` int(11) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `friends`;
CREATE TABLE `friends` (
  `from` int(11) DEFAULT NULL,
  `to` int(11) DEFAULT NULL,
  `added` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `logins`;
CREATE TABLE `logins` (
  `id` int(32) NOT NULL AUTO_INCREMENT,
  `hwid` varchar(128) COLLATE utf8mb3_unicode_ci NOT NULL,
  `ip` varchar(128) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;


DROP TABLE IF EXISTS `scores`;
CREATE TABLE `scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `beatmap_id` int(11) NOT NULL,
  `score` bigint(20) NOT NULL,
  `max_combo` int(11) NOT NULL,
  `full_combo` int(11) NOT NULL,
  `mods` int(11) NOT NULL,
  `count_300` int(11) NOT NULL,
  `count_100` int(11) NOT NULL,
  `count_50` int(11) NOT NULL,
  `count_miss` int(11) NOT NULL,
  `count_katus` int(11) NOT NULL,
  `count_gekis` int(11) NOT NULL,
  `time` datetime NOT NULL,
  `pass` tinyint(1) NOT NULL,
  `best` tinyint(1) NOT NULL,
  `mode` int(11) NOT NULL,
  `pp` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `server_logs`;
CREATE TABLE `server_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username_safe` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_title` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` enum('banned','normal','restricted','nominator','qat','moderator','developer','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `flags` enum('hqosu','aqn','ac_') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `premium_ends` datetime DEFAULT NULL,
  `silence_ends` datetime DEFAULT NULL,
  `account_create` datetime DEFAULT NULL,
  `last_online` datetime NOT NULL,
  `locked` tinyint(1) DEFAULT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hwid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clan` int(11) DEFAULT NULL,
  `clan_priv` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `username_safe`, `user_title`, `email`, `password`, `country`, `permissions`, `flags`, `premium_ends`, `silence_ends`, `account_create`, `last_online`, `locked`, `uuid`, `hwid`, `clan`, `clan_priv`) VALUES
(5,	'ThetaBot',	'thetabot',	'[keeping theta safe]',	'theta@maya.cx',	'nice try',	'JP',	'developer',	NULL,	NULL,	NULL, '2022-10-18 00:32:50',	'2022-10-18 00:32:50',	NULL,	NULL,	NULL,	NULL,	NULL);
DROP TABLE IF EXISTS `users_page`;
CREATE TABLE `users_page` (
  `id` int(11) NOT NULL,
  `userpage` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `featured_score` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `featured_score` (`featured_score`),
  CONSTRAINT `users_page_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`),
  CONSTRAINT `users_page_ibfk_2` FOREIGN KEY (`featured_score`) REFERENCES `scores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users_page` (`id`, `userpage`, `featured_score`) VALUES
(5,	'hello there, i am the bot keeping theta safe :)',	NULL);

DROP TABLE IF EXISTS `user_logs`;
CREATE TABLE `user_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` int(11) NOT NULL,
  `time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `source` (`source`),
  CONSTRAINT `user_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_logs_ibfk_2` FOREIGN KEY (`source`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `user_stats`;
CREATE TABLE `user_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `ranked_score` int(11) DEFAULT NULL,
  `total_score` int(11) DEFAULT NULL,
  `replays_watched` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `avg_accuracy` int(11) DEFAULT NULL,
  `total_hits` int(11) DEFAULT NULL,
  `performance` float DEFAULT NULL,
  `mode` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_stats` (`id`, `user_id`, `ranked_score`, `total_score`, `replays_watched`, `level`, `avg_accuracy`, `total_hits`, `performance`, `mode`) VALUES
(1,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	0),
(2,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	1),
(4,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	2),
(5,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	3),
(6,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	4),
(7,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	5),
(9,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	6),
(10,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	7),
(11,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	8),
(12,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	9),
(13,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	10),
(14,	5,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	11);

-- 2022-10-17 23:54:15
