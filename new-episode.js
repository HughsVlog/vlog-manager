const fs = require( 'fs' );
const copy = require( 'recursive-copy' );
const path = require( 'path' );
const decompress = require( 'decompress' );
const decompressGz = require( 'decompress-gz' );
const zlib = require( 'zlib' );

const help = `Vlog Manager v0.0.0
  by Hugh Guiney

Example usage:
  node new-episode.js -d 2019-01-01 [-t 'Getting A Lip Tattoo'] [-s 3]

Arguments:
  -h | --help     Display this Help screen. Disables other arguments.
  -d | --date     Date of recording (required).
                  Values:
                    - ISO 8601 date without a time component, e.g. 2019-01-01
                    - A relative day keyword: 'today' or 'yesterday'
  -t | --title    Title
  -s | --season   Season number. Corresponds to target directory.
                  Defaults to latest 'Season X' directory.
  -e | --episode  Episode number. For use in description.md.
`;

let episodeDirectory;

// https://stackoverflow.com/a/2998822/214325
function pad( number, size = 2 ) {
  let string = number.toString();

  while ( string.length < size ) {
    string = `0${string}`;
  }

  return string;
}

function error( message, showHelp = false ) {
  console.error( '\x1b[31m%s\x1b[0m', message );
  if ( showHelp ) {
    console.info( help );
  }
  process.exit( 1 );
}

function info( message = help ) {
  console.info( message );
  process.exit();
}

function attempt( command, errorType ) {
  try {
    return command();
  } catch ( err ) {
    error( `${errorType}: ${err.message}` );
    return false;
  }
}

function getConfig() {
  return attempt(
    () => JSON.parse( fs.readFileSync( './vlog-manager.json', 'utf8' ) ),
    'Error reading vlog-manager.json',
  );
}
const config = getConfig();
const seasonPattern = new RegExp( `${config.seasonPrefix}\\d+` );
const projectExtension = path.extname( config.defaultTemplate );

function getSeasonDirectories() {
  return attempt(
    () => {
      const cwd = fs.readdirSync( '.' );
      const seasons = [];
      cwd.forEach( ( item ) => {
        if ( seasonPattern.test( item ) ) {
          seasons.push( item );
        }
      } );
      return seasons;
    },
    'File system error',
  );
}

function makeSeasonDirectory( seasonNumber ) {
  return attempt(
    () => fs.mkdirSync( `${config.seasonPrefix}${seasonNumber.toString()}`, {
      "recursive": true,
    } ),
    'File system error',
  );
}

function getDayOfWeek( dateObject, type = 'short' ) {
  return (
    new Intl.DateTimeFormat( 'en-US', {
      "weekday": type,
    } ).format( dateObject )
  );
}

// function getSimpleISOString( dateObject ) {
//   return dateObject.toISOString().split( 'T' )[0];
// }

function makeEpisodeDirectory() {
  if ( !episodeDirectory ) {
    throw new Error( `\`episodeDirectory\` can not be falsy (type: ${typeof episodeDirectory})` );
  }

  return attempt(
    () => fs.mkdirSync( episodeDirectory, {
      "recursive": true,
    } ),
    'File system error',
  );
}

if ( process.argv.length === 2 ) {
  error( 'Expected at least one argument.\n', true );
}

let helpFlag = '-h';
let helpIndex = process.argv.indexOf( helpFlag );
if ( helpIndex === -1 ) {
  helpFlag = '--help';
  helpIndex = process.argv.indexOf( helpFlag );
}

if ( helpIndex > -1 ) {
  info();
}

let dateFlag = '-d';
let dateIndex = process.argv.indexOf( '-d' );
if ( dateIndex === -1 ) {
  dateFlag = '--date';
  dateIndex = process.argv.indexOf( '--date' );
}

if ( dateIndex === -1 ) {
  error( 'Missing required date argument ( -d | --date )' );
}

const simpleISOString = process.argv[++dateIndex];
const date = `${simpleISOString}T12:00:00Z`;
const dateObject = new Date( date );
try {
  dateObject.toISOString();
} catch ( err ) {
  error( `Error for argument ${dateFlag}: ${err.message}` );
}
const dayOfWeek = getDayOfWeek( dateObject );

let titleIndex = process.argv.indexOf( '-t' );
if ( titleIndex === -1 ) {
  titleIndex = process.argv.indexOf( '--title' );
}

const title = process.argv[++titleIndex];

let seasonFlag = '-s';
let seasonIndex = process.argv.indexOf( seasonFlag );
if ( seasonIndex === -1 ) {
  seasonFlag = '--season';
  seasonIndex = process.argv.indexOf( seasonFlag );
}

let episodeFlag = '-e';
let episodeIndex = process.argv.indexOf( episodeFlag );
if ( episodeIndex === -1 ) {
  episodeFlag = '--episode';
  episodeIndex = process.argv.indexOf( episodeFlag );
}

let targetSeason;
let targetEpisode;

if ( seasonIndex === -1 ) {
  const seasons = getSeasonDirectories();
  let latestSeason;

  if ( !seasons.length ) {
    makeSeasonDirectory( 1 );
    latestSeason = `${config.seasonPrefix}1`;
  } else {
    latestSeason = seasons[seasons.length - 1];
  }

  const seasonPieces = latestSeason.split( ' ' );
  latestSeason = parseInt( seasonPieces[seasonPieces.length - 1], 10 );
  targetSeason = latestSeason;
} else {
  targetSeason = process.argv[++seasonIndex];
}

if ( episodeIndex === -1 ) {
  // read episode number from last descriptoin.md
  // targetEpisode = ++latestEpisode;
} else {
  targetEpisode = process.argv[++episodeIndex];
}

const seasonDirectory = `${config.seasonPrefix}${targetSeason}`;
episodeDirectory = `${seasonDirectory}/${simpleISOString} - ${dayOfWeek} - ${title}`;

makeEpisodeDirectory();

const templateVars = {};

function templateVar( name ) {
  if ( !Object.prototype.hasOwnProperty.call( templateVars, name ) ) {
    templateVars[name] = new RegExp( `\\[${name}\\]`, 'g' );
  }
  return templateVars[name];
}

function replaceVars( text ) {
  return (
    text
      .replace( templateVar( 'episodeTitle' ), title )
      .replace( templateVar( 'vlogTitle' ), config.title )
      .replace( templateVar( 'twitter' ), config.author.twitter )
      .replace( templateVar( 'instagram' ), config.author.instagram )
      .replace( templateVar( 'snapchat' ), config.author.snapchat )
      .replace( templateVar( 'seasonId' ), `S${pad( targetSeason )}` )
      .replace( templateVar( 'episodeId' ), `E${pad( targetEpisode )}` )
      // .replace( templateVar( 'episodeNumber' ), '' )
      .replace( templateVar( 'date' ), simpleISOString )
      .replace( templateVar( 'dayOfWeek' ), dayOfWeek )
  );
}

copy( `${config.templateDirectory}_skeleton/`, episodeDirectory )
  .then( () => {
    let description = attempt(
      () => fs.readFileSync( `${config.templateDirectory}description.md`, 'utf8' ),
      'File system error',
    );

    description = replaceVars( description );

    const wrote = attempt(
      () => fs.writeFileSync(
        `${episodeDirectory}/${config.descriptionTargetDirectory}/description.md`,
        description,
        'utf8',
      ),
      'File system error',
    );

    return wrote;
  } )
  .then( () => {
    const templateFile = `${config.templateDirectory}${config.defaultTemplate}`;
    const newProject = `${episodeDirectory}/${config.videoEditingTargetDirectory}${simpleISOString}${projectExtension}`;

    return decompress( templateFile, `${config.templateDirectory}/extracted/`, {
      "inputFile": templateFile,
      "plugins": [
        decompressGz(),
      ],
    } ).then( ( files ) => {
      if ( files.length ) {
        let premiereXml = files[0].data.toString();
        premiereXml = replaceVars( premiereXml );
        attempt(
          () => fs.writeFileSync( newProject, zlib.gzipSync( premiereXml ), 'utf8' ),
          'File system error',
        );
        return newProject;
      }
      throw new Error( `Unable to decompress ${templateFile} using Gzip` );
    } );
  } )
  .then( newProject => console.info( `✨  ${newProject}` ) )
  .catch( ( err ) => {
    error( err.message );
  } );

// fs.symlink( '', './Current Episode', ( error ) => {
//   if ( error ) {
//     // …
//   }
// } );
