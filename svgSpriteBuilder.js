const fs = require( 'fs' );
const path = require( 'path' );
const SVGSpriter = require( 'svg-sprite' );
const File = require( 'vinyl' );
const glob = require( 'glob' );
const { bold, red, green, white, underline } = require('console-log-colors');

class SvgSpriteBuilder {
  constructor() {
      this.defaultOptions = { directory: null, config: {
        shape: {
          id: {
              separator: '--',
          },
          dimension: {
              attributes: true
          },
          transform: [
              {
                  svgo: {
                      plugins: [ {
                          name: 'preset-default',
                          params: {
                              overrides: {
                                  removeDimensions: false,
                                  removeViewBox: false,
                                  cleanupIDs: false
                                }
                            }
                        } ]
                    }
                }
            ],
        },
        svg: {
            namespaceIDs: false,
            namespaceClassnames: false,
            dimensionAttributes: true
        },
        mode: {
            stack: {
                dest: path.resolve( `dist` ),
                sprite: 'sprite-icons.svg',
                bust: false, // if 'true' add hash to the file name
                layout: 'packed', // can also be 'horizontal', 'vertical', 'diagonal',
                example: {
                  dest: `${path.resolve( 'dist/index.html' )}`
                },
            },
          }
      } 
    }
  }
  
  /**
   * 
   * @param {object} options - { directory: svg files directory which need to be bundled, config: SVGSpriter plugin config }
   *  
   * @returns void
   */
  async build( { directory, config } = this.defaultOptions ) {
    const basePath = `${__dirname}`;
    const args = process.argv.splice( 2 );
    let dir = directory ? directory : args.filter( item => item.startsWith ( '--directory' ) ).map( item => item.split( '=' ).reverse()[ 0 ] )[ 0 ];

    if (!dir) {
      console.log( '\n' );
      console.error( bold.red('\u274C'), red('Svg files directory was not defined.'), '\n' );
      return;
    }

    const dirExist = fs.existsSync( `${basePath}/${dir}` );

    if ( !dirExist ) {
      console.log( '\n' );
      console.error( red('Directory does not exist.'), '\n' );
      return;
    }

    const spriter = new SVGSpriter( config );
    const cwd = path.resolve( dir );
    const svgFiles = await this._getIcons( cwd );

    if (!svgFiles.success) {
      console.log( '\n' );
      console.error( red(`An error has occurred getting files: ${error}`), '\n' );
      return;
    }
  
    svgFiles.files.forEach( file => {
        spriter.add( new File( {
            path: path.join( cwd, file ),
            base: cwd,
            contents: fs.readFileSync( path.join( cwd, file ) )
        } ) );
    } );

    console.log( '\n' );
    console.log( '\u231B', white('Building sprite: Loading... '), '\n' );

    spriter.compile( ( error, result ) => {
        if ( !error ) {
            for ( const mode in result ) {
                for ( const resource in result[ mode ] ) {
                    fs.mkdirSync( path.dirname( result[ mode ][ resource ].path ), { recursive: true } );
                    fs.writeFileSync( result[ mode ][ resource ].path, result[ mode ][ resource ].contents );
                }

                console.log( bold.green('\u2705'), green(`Successfully build svg sprite for mode: ${bold.white(mode)} in: ${underline(config.mode[mode].example.dest)}`), '\n' );
            }
        } else {
            console.error( red( `An error has occurred compiling files: ${error}` ), '\n' );
        }
    } );
  }

  _getIcons( cwd ) {
      return new Promise( (resolve) => {
          glob( `**/*.svg`, { cwd: cwd }, ( err, files ) => {
            if (err) {
              resolve( { success: false, error: err } );
            }

            resolve( { success: true, files } );
          } );
      } );
  }
}

module.exports = SvgSpriteBuilder;