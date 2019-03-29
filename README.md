# vlog-manager

Easily generate project files for daily vlogs.

## Usage

Create a file `vlog-manager.json` at the root of the directory. This file holds various template variables and paths.

```json
{
  "title": "Hugh’s Vlog",
  "author": {
    "name": "Hugh Guiney",
    "twitter": "https://twitter.com/LordPancreas",
    "instagram": "https://www.instagram.com/lordpancreas/",
    "snapchat": "https://www.snapchat.com/add/hguiney"
  },
  "templateDirectory": "Templates/",
  "descriptionTargetDirectory": "Export/",
  "defaultTemplate": "Season 3.1 Episode.prproj",
  "seasonPrefix": "Season "
}
```

Then, in terminal, type a command such as:

```sh
node new-episode.js -d 2019-01-01 -t 'Getting A Lip Tattoo' -s 3
```

This will generate a new folder with the path `Season 3/2019-01-01 - Tue - Getting A Lip Tattoo`, with everything in `Templates/` copied over to it.

The file `Templates/description.md` will be copied to `Export/description.md`, and all relevant template variables will be replaced in the new file.

### Arguments

<table>
<thead>
  <tr>
    <th scope="col" colspan="2">Flag</th>
    <th scope="col">Required</th>
    <th scope="col">Description</th>
    <th scope="col">Permitted Value(s)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td><code>-h</code></td>
    <td><code>--help</code></td>
    <td></td>
    <td>Display this Help screen. Disables other arguments.</td>
    <td></td>
  </tr>
  <tr>
    <td><code>-d</code></td>
    <td><code>--date</code></td>
    <td>Yes</td>
    <td>Date of recording</td>
    <td>    
      <ul>
        <li>ISO 8601 date without a time component, e.g. 2019-01-01</li>
        <li>A relative day keyword: <code>today</code> or <code>yesterday</code></li>
      </ul>
    </td>
  </tr>
  <tr>
    <td><code>-t</code></td>
    <td><code>--title</code></td>
    <td></td>
    <td>Title</td>
    <td>Text</td>
  </tr>
  <tr>
    <td><code>-s</code></td>
    <td><code>--season</code></td>
    <td></td>
    <td>Season number. Corresponds to target directory. Defaults to latest Season <var>X</var> directory.</td>
    <td>Number</td>
  </tr>
  <tr>
    <td><code>-e</code></td>
    <td><code>--episode</code></td>
    <td></td>
    <td>Episode number. For use in <code>description.md</code>.</td>
    <td>Number</td>
  </tr>
</tbody>
</table>

### vlog-manager.json

<table>
<thead>
  <tr>
    <th scope="col">Key</th>
    <th scope="col">Required</th>
    <th scope="col">Description</th>
    <th scope="col">Permitted Value(s)</th>
    <th scope="col">Default Value(s)</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td><code>title</code></td>
    <td></td>
    <td>The title of your vlog.</td>
    <td>Text</td>
    <td></td>
  </tr>
  <tr>
    <td><code>author</code></td>
    <td></td>
    <td>Information about the primary author of the vlog.</td>
    <td>    
      <ul>
        <li><code>name</code> (Text)</li>
        <li><code>twitter</code> (URL)</li>
        <li><code>instagram</code> (URL)</li>
        <li><code>snapchat</code> (URL)</li>
      </ul>
    </td>
    <td></td>
  </tr>
  <tr>
    <td><code>templateDirectory</code></td>
    <td></td>
    <td></td>
    <td>Path</td>
    <td><code>Templates/</code></td>
  </tr>
  <tr>
    <td><code>descriptionTargetDirectory</code></td>
    <td></td>
    <td>Where to write <code>description.md</code></td>
    <td>Path</td>
    <td><code>Export/</code></td>
  </tr>
  <tr>
    <td><code>defaultTemplate</code></td>
    <td></td>
    <td>Which project file (<code>.prproj</code>, <code>.fcpx</code>, etc.) to serve as the base for new vlog episodes.</td>
    <td>File name relative to <code>templateDirectory</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>seasonPrefix</code></td>
    <td></td>
    <td>How season folders should be named. Prepended to season number.</td>
    <td>Text</td>
    <td><code>Season </code> (with trailing space)</td>
  </tr>
</tbody>
</table>