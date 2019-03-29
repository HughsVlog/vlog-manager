const fs = require( 'fs' );
const copy = require( 'recursive-copy' );

const help = `Vlog Manager v0.0.0
  by Hugh Guiney

Example usage:
  node new-episode.js -d 2019-01-01 [-t 'Getting A Lip Tattoo'] [-s 3]

Arguments:
  -h | --help\tDisplay this Help screen. Disables other arguments.
  -d | --date\tDate of recording (required).
             \tValues:
             \t  - ISO 8601 date without a time component, e.g. 2019-01-01
             \t  - A relative day keyword: 'today' or 'yesterday'
  -t | --title\tTitle
  -s | --season\tSeason number. Corresponds to target directory.
               \tDefaults to latest 'Season X' directory.
  -e | --episode\tEpisode number. For use in description.md.
`;

// https://stackoverflow.com/a/2998822/214325
function pad( number, size = 2 ) {
  let string = number.toString();

  while ( string.length < size ) {
    string = '0' + string;
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
    'Error reading vlog-manager.json'
  );
}

function getSeasonDirectories() {
  return attempt(
    () => {
      const cwd = fs.readdirSync( '.' );
      let seasons = [];
      cwd.forEach( ( item ) => {
        if ( seasonPattern.test( item ) ) {
          seasons.push( item );
        }
      } );
      return seasons;
    },
    'File system error'
  );
}

function makeSeasonDirectory( seasonNumber ) {
  return attempt(
    () => fs.mkdirSync( `${config.seasonPrefix}${seasonNumber.toString()}`, {
      "recursive": true
    } ),
    'File system error'
  );
}

function getDayOfWeek( dateObject, type = 'short' ) {
  return (
    new Intl.DateTimeFormat( 'en-US', {
      "weekday": type
    } ).format( dateObject )
  );
}

function getSimpleISOString( dateObject ) {
  return dateObject.toISOString().split( 'T' )[0];
}

function makeEpisodeDirectory( seasonDirectory, dateObject, title = '' ) {
  const dayOfWeek = getDayOfWeek( dateObject );
  const date = getSimpleISOString( dateObject );
  const path = `${seasonDirectory}/${date} - ${dayOfWeek} - ${title}`;

  attempt(
    () => fs.mkdirSync( path, {
      "recursive": true
    } ),
    'File system error'
  );

  return path;
}

const config = getConfig();
const seasonPattern = new RegExp( `${config.seasonPrefix}\\d+` );

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

const date = process.argv[++dateIndex] + 'T12:00:00Z';
const dateObject = new Date( date );
try {
  dateObject.toISOString();
} catch ( err ) {
  error( `Error for argument ${dateFlag}: ${err.message}` );
}

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
  let seasons = getSeasonDirectories();
  let latestSeason;
  let seasonPieces;

  if ( !seasons.length ) {
    makeSeasonDirectory( 1 );
    latestSeason = `${config.seasonPrefix}1`;
  } else {
    latestSeason = seasons[seasons.length - 1];
  }

  seasonPieces = latestSeason.split( ' ' );
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

let targetSeasonDirectory = `${config.seasonPrefix}${targetSeason}`;
let targetEpisodeDirectory = makeEpisodeDirectory( targetSeasonDirectory, dateObject, title );

copy( `${config.templateDirectory}_skeleton/`, targetEpisodeDirectory )
  .then( ( results ) => {
    // console.info( 'Copied ' + results.length + ' files' );
    // return copy(
    //   `${config.templateDirectory}description.md`,
    //   `${targetEpisodeDirectory}/${config.descriptionTargetDirectory}/description.md`
    // );
    let description = attempt(
      () => fs.readFileSync( `${config.templateDirectory}description.md`, 'utf8' ),
      'File system error'
    );

    function templateVar( name ) {
      return new RegExp( `\\[${name}\\]`, 'g' );
    }

    description = description
      .replace( templateVar( 'episodeTitle' ), title )
      .replace( templateVar( 'vlogTitle' ), config.title )
      .replace( templateVar( 'twitter' ), config.author.twitter )
      .replace( templateVar( 'instagram' ), config.author.instagram )
      .replace( templateVar( 'snapchat' ), config.author.snapchat )
      .replace( templateVar( 'seasonId' ), `S${pad( targetSeason )}` )
      .replace( templateVar( 'episodeId' ), `E${pad( targetEpisode )}` )
      // .replace( templateVar( 'episodeNumber' ), '' )
      .replace( templateVar( 'date' ), getSimpleISOString( dateObject ) )
      .replace( templateVar( 'dayOfWeek' ), getDayOfWeek( dateObject ) )
    ;

    let wrote = attempt(
      () => fs.writeFileSync(
        `${targetEpisodeDirectory}/${config.descriptionTargetDirectory}/description.md`,
        description,
        'utf8'
      ),
      'File system error'
    );

    console.log( wrote );
  } )
  .then( ( results ) => {

  } )
  .catch( ( err ) => {
    error( err.message );
  } );

// fs.symlink( '', './Current Episode', ( error ) => {
//   if ( error ) {
//     // …
//   }
// } );