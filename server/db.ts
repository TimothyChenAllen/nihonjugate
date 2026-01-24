import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const db = new Database('verbs.db');

export interface VerbRecord {
  id: number;
  dictionary_kanji: string;
  meaning: string;
  form_name: string;
  conj_kanji: string;
  conj_kana: string;
  conj_romaji: string;
  correct_count: number;
  attempt_count: number;
  is_active: number; // 0 or 1
}

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS verbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dictionary_kanji TEXT,
    dictionary_kana TEXT,
    dictionary_romaji TEXT,
    meaning TEXT,
    form_name TEXT,
    conj_kanji TEXT,
    conj_kana TEXT,
    conj_romaji TEXT,
    correct_count INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    UNIQUE(dictionary_kanji, form_name)
  )
`);

// The CSV Data (Embedded for simplicity, or load from file)
const CSV_DATA = `Dictionary_Kanji,Dictionary_Kana,Dictionary_Romaji,Meaning,Form_Name,Conj_Kanji,Conj_Kana,Conj_Romaji
食べる,たべる,Taberu,To eat,Polite Form,食べます,たべます,Tabemasu
食べる,たべる,Taberu,To eat,Masu Stem,食べ,たべ,Tabe
食べる,たべる,Taberu,To eat,Te-Form,食べて,たべて,Tabete
食べる,たべる,Taberu,To eat,Past Tense (Plain),食べた,たべた,Tabeta
食べる,たべる,Taberu,To eat,Continuous Form,食べている,たべている,Tabeteiru
食べる,たべる,Taberu,To eat,Negative Form,食べない,たべない,Tabenai
食べる,たべる,Taberu,To eat,Past-Negative Form,食べなかった,たべなかった,Tabenakatta
食べる,たべる,Taberu,To eat,Passive Form,食べられる,たべられる,Taberareru
食べる,たべる,Taberu,To eat,Causative Form,食べさせる,たべさせる,Tabesaseru
食べる,たべる,Taberu,To eat,Causative Passive Form,食べさせられる,たべさせられる,Tabesaserareru
食べる,たべる,Taberu,To eat,Imperative Form,食べろ,たべろ,Tabero
食べる,たべる,Taberu,To eat,BA Hypothetical Form,食べれば,たべれば,Tabereba
食べる,たべる,Taberu,To eat,TARA Conditional Form,食べたら,たべたら,Tabetara
食べる,たべる,Taberu,To eat,Potential Form,食べられる,たべられる,Taberareru
食べる,たべる,Taberu,To eat,Volitional Form,食べよう,たべよう,Tabeyou
見る,みる,Miru,To see,Polite Form,見ます,みます,Mimasu
見る,みる,Miru,To see,Masu Stem,見,み,Mi
見る,みる,Miru,To see,Te-Form,見て,みて,Mite
見る,みる,Miru,To see,Past Tense (Plain),見た,みた,Mita
見る,みる,Miru,To see,Continuous Form,見ている,みている,Miteiru
見る,みる,Miru,To see,Negative Form,見ない,みない,Minai
見る,みる,Miru,To see,Past-Negative Form,見なかった,みなかった,Minakatta
見る,みる,Miru,To see,Passive Form,見られる,みられる,Mirareru
見る,みる,Miru,To see,Causative Form,見させる,みさせる,Misaseru
見る,みる,Miru,To see,Causative Passive Form,見させられる,みさせられる,Misaserareru
見る,みる,Miru,To see,Imperative Form,見ろ,みろ,Miro
見る,みる,Miru,To see,BA Hypothetical Form,見れば,みれば,Mireba
見る,みる,Miru,To see,TARA Conditional Form,見たら,みたら,Mitara
見る,みる,Miru,To see,Potential Form,見られる,みられる,Mirareru
見る,みる,Miru,To see,Volitional Form,見よう,みよう,Miyou
会う,あう,Au,To meet,Polite Form,会います,あいます,Aimasu
会う,あう,Au,To meet,Masu Stem,会い,あい,Ai
会う,あう,Au,To meet,Te-Form,会って,あって,Atte
会う,あう,Au,To meet,Past Tense (Plain),会った,あった,Atta
会う,あう,Au,To meet,Continuous Form,会っている,あっている,Atteiru
会う,あう,Au,To meet,Negative Form,会わない,あわない,Awanai
会う,あう,Au,To meet,Past-Negative Form,会わなかった,あわなかった,Awanakatta
会う,あう,Au,To meet,Passive Form,会われる,あわれる,Awareru
会う,あう,Au,To meet,Causative Form,会わせる,あわせる,Awaseru
会う,あう,Au,To meet,Causative Passive Form,会わせられる,あわせられる,Awaserareru
会う,あう,Au,To meet,Imperative Form,会え,あえ,Ae
会う,あう,Au,To meet,BA Hypothetical Form,会えば,あえば,Aeba
会う,あう,Au,To meet,TARA Conditional Form,会ったら,あったら,Attara
会う,あう,Au,To meet,Potential Form,会える,あえる,Aeru
会う,あう,Au,To meet,Volitional Form,会おう,あおう,Aou
待つ,まつ,Matsu,To wait,Polite Form,待ちます,まちます,Machimasu
待つ,まつ,Matsu,To wait,Masu Stem,待ち,まち,Machi
待つ,まつ,Matsu,To wait,Te-Form,待って,まって,Matte
待つ,まつ,Matsu,To wait,Past Tense (Plain),待った,まった,Matta
待つ,まつ,Matsu,To wait,Continuous Form,待っている,まっている,Matteiru
待つ,まつ,Matsu,To wait,Negative Form,待たない,またない,Matanai
待つ,まつ,Matsu,To wait,Past-Negative Form,待たなかった,またなかった,Matanakatta
待つ,まつ,Matsu,To wait,Passive Form,待たれる,またれる,Matareru
待つ,まつ,Matsu,To wait,Causative Form,待たせる,またせる,Mataseru
待つ,まつ,Matsu,To wait,Causative Passive Form,待たせられる,またせられる,Mataserareru
待つ,まつ,Matsu,To wait,Imperative Form,待て,まて,Mate
待つ,まつ,Matsu,To wait,BA Hypothetical Form,待てば,まてば,Mateba
待つ,まつ,Matsu,To wait,TARA Conditional Form,待ったら,まったら,Mattara
待つ,まつ,Matsu,To wait,Potential Form,待てる,まてる,Materu
待つ,まつ,Matsu,To wait,Volitional Form,待とう,まとう,Matou
読む,よむ,Yomu,To read,Polite Form,読みます,よみます,Yomimasu
読む,よむ,Yomu,To read,Masu Stem,読み,よみ,Yomi
読む,よむ,Yomu,To read,Te-Form,読んで,よんで,Yonde
読む,よむ,Yomu,To read,Past Tense (Plain),読んだ,よんだ,Yonda
読む,よむ,Yomu,To read,Continuous Form,読んでいる,よんでいる,Yondeiru
読む,よむ,Yomu,To read,Negative Form,読まない,よまない,Yomanai
読む,よむ,Yomu,To read,Past-Negative Form,読まなかった,よまなかった,Yomanakatta
読む,よむ,Yomu,To read,Passive Form,読まれる,よまれる,Yomareru
読む,よむ,Yomu,To read,Causative Form,読ませる,よませる,Yomaseru
読む,よむ,Yomu,To read,Causative Passive Form,読ませられる,よませられる,Yomaserareru
読む,よむ,Yomu,To read,Imperative Form,読め,よめ,Yome
読む,よむ,Yomu,To read,BA Hypothetical Form,読めば,よめば,Yomeba
読む,よむ,Yomu,To read,TARA Conditional Form,読んだら,よんだら,Yondara
読む,よむ,Yomu,To read,Potential Form,読める,よめる,Yomeru
読む,よむ,Yomu,To read,Volitional Form,読もう,よもう,Yomou
遊ぶ,あそぶ,Asobu,To play,Polite Form,遊びます,あそびます,Asobimasu
遊ぶ,あそぶ,Asobu,To play,Masu Stem,遊び,あそび,Asobi
遊ぶ,あそぶ,Asobu,To play,Te-Form,遊んで,あそんで,Asonde
遊ぶ,あそぶ,Asobu,To play,Past Tense (Plain),遊んだ,あそんだ,Asonda
遊ぶ,あそぶ,Asobu,To play,Continuous Form,遊んでいる,あそんでいる,Asondeiru
遊ぶ,あそぶ,Asobu,To play,Negative Form,遊ばない,あそばない,Asobanai
遊ぶ,あそぶ,Asobu,To play,Past-Negative Form,遊ばなかった,あそばなかった,Asobanakatta
遊ぶ,あそぶ,Asobu,To play,Passive Form,遊ばれる,あそばれる,Asobareru
遊ぶ,あそぶ,Asobu,To play,Causative Form,遊ばせる,あそばせる,Asobaseru
遊ぶ,あそぶ,Asobu,To play,Causative Passive Form,遊ばせられる,あそばせられる,Asobaserareru
遊ぶ,あそぶ,Asobu,To play,Imperative Form,遊べ,あそべ,Asobe
遊ぶ,あそぶ,Asobu,To play,BA Hypothetical Form,遊べば,あそべば,Asobeba
遊ぶ,あそぶ,Asobu,To play,TARA Conditional Form,遊んだら,あそんだら,Asondara
遊ぶ,あそぶ,Asobu,To play,Potential Form,遊べる,あそべる,Asoberu
遊ぶ,あそぶ,Asobu,To play,Volitional Form,遊ぼう,あそぼう,Asobou
書く,かく,Kaku,To write,Polite Form,書きます,かきます,Kakimasu
書く,かく,Kaku,To write,Masu Stem,書き,かき,Kaki
書く,かく,Kaku,To write,Te-Form,書いて,かいて,Kaite
書く,かく,Kaku,To write,Past Tense (Plain),書いた,かいた,Kaita
書く,かく,Kaku,To write,Continuous Form,書いている,かいている,Kaiteiru
書く,かく,Kaku,To write,Negative Form,書かない,かかない,Kakanai
書く,かく,Kaku,To write,Past-Negative Form,書かなかった,かかなかった,Kakanakatta
書く,かく,Kaku,To write,Passive Form,書かれる,かかれる,Kakareru
書く,かく,Kaku,To write,Causative Form,書かせる,かかせる,Kakaseru
書く,かく,Kaku,To write,Causative Passive Form,書かせられる,かかせられる,Kakaserareru
書く,かく,Kaku,To write,Imperative Form,書け,かけ,Kake
書く,かく,Kaku,To write,BA Hypothetical Form,書けば,かけば,Kakeba
書く,かく,Kaku,To write,TARA Conditional Form,書いたら,かいたら,Kaitara
書く,かく,Kaku,To write,Potential Form,書ける,かける,Kakeru
書く,かく,Kaku,To write,Volitional Form,書こう,かこう,Kakou
聞く,きく,Kiku,To listen,Polite Form,聞きます,ききます,Kikimasu
聞く,きく,Kiku,To listen,Masu Stem,聞き,きき,Kiki
聞く,きく,Kiku,To listen,Te-Form,聞いて,きいて,Kiite
聞く,きく,Kiku,To listen,Past Tense (Plain),聞いた,きいた,Kiita
聞く,きく,Kiku,To listen,Continuous Form,聞いている,きいている,Kiiteiru
聞く,きく,Kiku,To listen,Negative Form,聞かない,きかない,Kikanai
聞く,きく,Kiku,To listen,Past-Negative Form,聞かなかった,きかなかった,Kikanakatta
聞く,きく,Kiku,To listen,Passive Form,聞かれる,きかれる,Kikareru
聞く,きく,Kiku,To listen,Causative Form,聞かせる,きかせる,Kikaseru
聞く,きく,Kiku,To listen,Causative Passive Form,聞かせられる,きかせられる,Kikaserareru
聞く,きく,Kiku,To listen,Imperative Form,聞け,きけ,Kike
聞く,きく,Kiku,To listen,BA Hypothetical Form,聞けば,きけば,Kikeba
聞く,きく,Kiku,To listen,TARA Conditional Form,聞いたら,きいたら,Kiitara
聞く,きく,Kiku,To listen,Potential Form,聞ける,きける,Kikeru
聞く,きく,Kiku,To listen,Volitional Form,聞こう,きこう,Kikou
泳ぐ,およぐ,Oyogu,To swim,Polite Form,泳ぎます,およぎます,Oyogimasu
泳ぐ,およぐ,Oyogu,To swim,Masu Stem,泳ぎ,およぎ,Oyogi
泳ぐ,およぐ,Oyogu,To swim,Te-Form,泳いで,およいで,Oyoide
泳ぐ,およぐ,Oyogu,To swim,Past Tense (Plain),泳いだ,およいだ,Oyoida
泳ぐ,およぐ,Oyogu,To swim,Continuous Form,泳いでいる,およいでいる,Oyoideiru
泳ぐ,およぐ,Oyogu,To swim,Negative Form,泳がない,およがない,Oyoganai
泳ぐ,およぐ,Oyogu,To swim,Past-Negative Form,泳がなかった,およがなかった,Oyoganakatta
泳ぐ,およぐ,Oyogu,To swim,Passive Form,泳がれる,およがれる,Oyogareru
泳ぐ,およぐ,Oyogu,To swim,Causative Form,泳がせる,およがせる,Oyogaseru
泳ぐ,およぐ,Oyogu,To swim,Causative Passive Form,泳がせられる,およがせられる,Oyogaserareru
泳ぐ,およぐ,Oyogu,To swim,Imperative Form,泳げ,およげ,Oyoge
泳ぐ,およぐ,Oyogu,To swim,BA Hypothetical Form,泳げば,およげば,Oyogeba
泳ぐ,およぐ,Oyogu,To swim,TARA Conditional Form,泳いだら,およいだら,Oyoidara
泳ぐ,およぐ,Oyogu,To swim,Potential Form,泳げる,およげる,Oyogeru
泳ぐ,およぐ,Oyogu,To swim,Volitional Form,泳ごう,およごう,Oyogou
急ぐ,いそぐ,Isogu,To hurry,Polite Form,急ぎます,いそぎます,Isogimasu
急ぐ,いそぐ,Isogu,To hurry,Masu Stem,急ぎ,いそぎ,Isogi
急ぐ,いそぐ,Isogu,To hurry,Te-Form,急いで,いそいで,Isoide
急ぐ,いそぐ,Isogu,To hurry,Past Tense (Plain),急いだ,いそいだ,Isoida
急ぐ,いそぐ,Isogu,To hurry,Continuous Form,急いでいる,いそいでいる,Isoideiru
急ぐ,いそぐ,Isogu,To hurry,Negative Form,急がない,いそがない,Isoganai
急ぐ,いそぐ,Isogu,To hurry,Past-Negative Form,急がなかった,いそがなかった,Isoganakatta
急ぐ,いそぐ,Isogu,To hurry,Passive Form,急がれる,いそがれる,Isogareru
急ぐ,いそぐ,Isogu,To hurry,Causative Form,急がせる,いそがせる,Isogaseru
急ぐ,いそぐ,Isogu,To hurry,Causative Passive Form,急がせられる,いそがせられる,Isogaserareru
急ぐ,いそぐ,Isogu,To hurry,Imperative Form,急げ,いそげ,Isoge
急ぐ,いそぐ,Isogu,To hurry,BA Hypothetical Form,急げば,いそげば,Isogeba
急ぐ,いそぐ,Isogu,To hurry,TARA Conditional Form,急いだら,いそいだら,Isoidara
急ぐ,いそぐ,Isogu,To hurry,Potential Form,急げる,いそげる,Isogeru
急ぐ,いそぐ,Isogu,To hurry,Volitional Form,急ごう,いそごう,Isogou
話す,はなす,Hanasu,To speak,Polite Form,話します,はなします,Hanashimasu
話す,はなす,Hanasu,To speak,Masu Stem,話し,はなし,Hanashi
話す,はなす,Hanasu,To speak,Te-Form,話して,はなして,Hanashite
話す,はなす,Hanasu,To speak,Past Tense (Plain),話した,はなした,Hanashita
話す,はなす,Hanasu,To speak,Continuous Form,話している,はなしている,Hanashiteiru
話す,はなす,Hanasu,To speak,Negative Form,話さない,はなさない,Hanasanai
話す,はなす,Hanasu,To speak,Past-Negative Form,話さなかった,はなさなかった,Hanasanakatta
話す,はなす,Hanasu,To speak,Passive Form,話される,はなされる,Hanasareru
話す,はなす,Hanasu,To speak,Causative Form,話させる,はなさせる,Hanasaseru
話す,はなす,Hanasu,To speak,Causative Passive Form,話させられる,はなさせられる,Hanasaserareru
話す,はなす,Hanasu,To speak,Imperative Form,話せ,はなせ,Hanase
話す,はなす,Hanasu,To speak,BA Hypothetical Form,話せば,はなせば,Hanaseba
話す,はなす,Hanasu,To speak,TARA Conditional Form,話したら,はなしたら,Hanashitara
話す,はなす,Hanasu,To speak,Potential Form,話せる,はなせる,Hanaseru
話す,はなす,Hanasu,To speak,Volitional Form,話そう,はなそう,Hanasou
押す,おす,Osu,To push,Polite Form,押します,おします,Oshimasu
押す,おす,Osu,To push,Masu Stem,押し,おし,Oshi
押す,おす,Osu,To push,Te-Form,押して,おして,Oshite
押す,おす,Osu,To push,Past Tense (Plain),押した,おした,Oshita
押す,おす,Osu,To push,Continuous Form,押している,おしている,Oshiteiru
押す,おす,Osu,To push,Negative Form,押さない,おさない,Osanai
押す,おす,Osu,To push,Past-Negative Form,押さなかった,おさなかった,Osanakatta
押す,おす,Osu,To push,Passive Form,押される,おされる,Osareru
押す,おす,Osu,To push,Causative Form,押させる,おさせる,Osaseru
押す,おす,Osu,To push,Causative Passive Form,押させられる,おさせられる,Osaserareru
押す,おす,Osu,To push,Imperative Form,押せ,おせ,Ose
押す,おす,Osu,To push,BA Hypothetical Form,押せば,おせば,Oseba
押す,おす,Osu,To push,TARA Conditional Form,押したら,おしたら,Oshitara
押す,おす,Osu,To push,Potential Form,押せる,おせる,Oseru
押す,おす,Osu,To push,Volitional Form,押そう,おそう,Osou
`;

export const seedData = () => {
    const records = parse(CSV_DATA, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    const insert = db.prepare(`
        INSERT OR IGNORE INTO verbs (
            dictionary_kanji, dictionary_kana, dictionary_romaji, meaning, 
            form_name, conj_kanji, conj_kana, conj_romaji
        ) VALUES (
            @Dictionary_Kanji, @Dictionary_Kana, @Dictionary_Romaji, @Meaning, 
            @Form_Name, @Conj_Kanji, @Conj_Kana, @Conj_Romaji
        )
    `);

    const insertMany = db.transaction((rows) => {
        for (const row of rows) insert.run(row);
    });

    insertMany(records);
    console.log(`Database seeded with ${records.length} records.`);
};

export default db;