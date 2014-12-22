# Elite50 Table AngularJS Directive

An [AngularJS](https://angularjs.org/) directive for customizable tables with dynamic lists of data.

## Using the directive

### Install via bower

```shell
bower install e50-table
```

### Include the JS file in your HTML

```html
<script src="[path-to-e50-table]/dist/e50-table.min.js"></script>
```

Or, include the filepath in your task runner configuration (like [Grunt](http://gruntjs.com/)).

### Require in your AngularJS app

```javascript
var app = angular.module('app', ['e50Table']);
```

### Use the directive in your application

##### Example:
```javascript
$scope.myList = [
  { left: 'A', right: 'B' },
  { left: 'C', right: 'D' }
];
```

```html
<table e50-table e50-data="myList">
  <thead>
    <tr>
      <th>L</th>
      <th>R</th>
    </tr>
  </thead>
  <tbody>
    <tr e50-table-row>
      <td>{{ t.left }}</td>
      <td>{{ t.right }}</td>
    </tr>
  </tbody>
</table>
```

##### Result:

|L|R|
|-|-|
|A|B|
|C|D|

## Full Documentation

### Attributes

The Elite50 Table supports many different HTML attributes, allowing for a large degree of customization and functionality. With the exception of `e50-table` and `e50-table-row`, all attributes are optional. The full list of possible attributes follows:

#### `e50-table`

**Required**. Demarcates the directive and establishes a child scope. Unless otherwise stated, all Elite50 Table attributes must be placed on the same HTML element as this one.

#### `e50-table-row`

**Required**. Placed on a *different* HTML element than `e50-table`. This element will be repeated for each value in the data set, creating multiple child scopes. Works very similarly to [ngRepeat](https://docs.angularjs.org/api/ng/directive/ngRepeat).

#### `e50-data="array"`

If provided, creates a two-way binding between a parent scope variable `array` and the table's data set. Expects `array` to be an array (unless `e50-data-prop` is set). Each value in this array will correspond to an item in the scope of a single table row, as the scope variable `t` (unless `e50-data-key` is set). See example above under **Using the directive**.

#### `e50-data-prop="string"`

If provided, expects the table data (such as defined by `e50-data` or `e50-fetch`) to be an object with property `string`. In this case, `data.string` must be the array of row data.

##### Example:

```javascript
$scope.myList = {
  count: 3,
  list: [ 'Aaron', 'James', 'Ted' ]
};
```

```html
<table e50-table e50-data="myList" e50-data-prop="list">
  <thead>
    <tr>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <tr e50-table-row>
      <td>{{ t }}</td>
    </tr>
  </tbody>
</table>
```

##### Result:

|Name |
|-----|
|Aaron|
|James|
|Ted  |

#### `e50-data-key="string"`

**Default: `t`**. If provided, changes the alias of an individual data value in each row's child scope from `t` to `string`.

#### `e50-fetch="url"`

If provided, the table will make an AJAX request to the specified `url` and use the response to populate the table. It expects the response as a JSON object with a `data` property, which it will use to fill the table.

The `url` can be parameterized using `:param` syntax, as in [ngResource](https://docs.angularjs.org/api/ngResource). These paremeters will be populated by the `e50-fetch-params` attribute.

If `e50-data` is set, the result of the fetch will replace the parent scope variable defined by the `e50-data` attributed.

By default, the directive will make a `GET` request with no parameters. This, and other behaviors, can be modified with other attributes.

See `e50-fetch-params` for examples.

#### `e50-fetch-method="method"`

**Requires `e50-fetch`**. **Default: 'GET'**. Specifies the type of HTTP request to make when fetching table data.

#### `e50-fetch-params="object"`

**Requires `e50-fetch`**. If provided, defines additional parameters to be sent in the fetch HTTP request. This can be any parent-scope parsable object.

If the url defined by `e50-fetch` has any `:param` syntax parameters, they will be drawn from this object. Any additional keys will be passed as query string parameters.

Any time this object changes, the table will make another fetch request with the new parameters and update the table data (unless `e50-fetch-once` or `e50-fetch-limit` is set).

##### Example 1:

```javascript
$scope.myParams = { count: 10, type: 'names' };
$scope.myUrl = '/endpoint/:type';
```

```html
<table e50-table e50-fetch="{{ myUrl }}" e50-fetch-params="myParams">
```

The above would make a GET request to `/endpoint/names?count=10`.

##### Example 2:

```html
<table e50-table e50-fetch="/endpoint/:type"
  e50-fetch-params="{ count: 10, type: 'names' }">
```

This makes the same request as **Example 1**.

#### `e50-fetch-body="object"`

**Requires `e50-fetch`**. Similarly to `e50-fetch-params`, this object is sent as the body of the HTTP request (for appropriate `e50-fetch-method`s that support request bodies). Like for `e50-fetch-params`, a new request will be made every time this object is changed (unless `e50-fetch-once` or `e50-fetch-limit` is set).

#### `e50-fetch-once`

**Requires `e50-fetch`**. If provided, the table will only make a single initial AJAX fetch request, and will *not* update if `e50-fetch-params` or `e50-fetch-body` changes.

#### `e50-poll` `e50-poll="integer"`

**Requires `e50-fetch`**. If provided, the table will make a fetch request every
`1000ms` (or `integer` milliseconds if a value is provided), and update the table if the response is successful and the data has changed.

#### `e50-infinite-scroll`

**Requires `e50-fetch`**. If provided, the table will automatically load more results if fully scrolled to the bottom. This requires special `offset` and `limit` keys (or as otherwise defined by `e50-offset-key` or `e50-limit-key`) to be included in either the `e50-fetch-params` or `e50-fetch-body`. The fetch endpoint should account for these parameters (fetching `limit` results starting at `offset`, similar to SQL `select` syntax).

If scrolled to the bottom, the `offset` will be incremented by `limit` and the table will fetch, appending the new results to the end of the list. If `e50-poll` is enabled, the `limit` instead will be incremented, increasing the size of the data set fetched on each poll.

If any of the other `e50-fetch-params` or `e50-fetch-body` values change, the `offset` and `limit` will reset to their initial values, and the table will update as expected.

#### `e50-offset-key="string"`

**Requires `e50-infinite-scroll`**. **Default: 'offset'**. Specifies a different name for the infinite-scrolling offset parameter included in either `e50-fetch-params` or `e50-fetch-body`.

#### `e50-limit-key="string"`

**Requires `e50-infinite-scroll`**. **Default: 'limit'**. Specifies a different name for the infinite-scrolling limit parameter included in either `e50-fetch-params` or `e50-fetch-body`.

#### `e50-filter="function"`

If provided, the table will be filtered according to parent scope function provided. The function takes in a single row's data as a parameter, and must return true if it should be included, or false otherwise.

##### Example:

```javascript
$scope.filter = function(s) {
   return s.length === 4;
};
$scope.data = ['Will', 'James', 'John', 'George'];
```

```html
<table e50-table e50-data="data" e50-filter="filter">
  <thead>
    <tr>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{ t }}</td>
    </tr>
  </tbody>
</table>
```

##### Result:

|Name|
|----|
|Will|
|John|

#### `e50-sort="string"`

If provided, will order the table data according to the provided `string`. Uses the same format as an Angular string [orderBy](https://docs.angularjs.org/api/ng/filter/orderBy) expression.

#### `e50-sort-reverse="string"`

**Requires `e50-sort`**. If provided, will reverse the table sort order according to its value cast as a boolean. Namely, if `string='true'` the ordering will be reversed.

#### `e50-fetch-limit="integer"`

**Requires `e50-fetch`, `e50-fetch-limit-prop`**. If provided, the table will act as though `e50-fetch-once` is set, if a fetched property (see `e50-fetch-limit-prop`) is less than or equal to `integer`.

This feature is useful if you have data sets of varying sizes, and you want to forego server-side sorting if the total size of the data set is less than an arbitrary limit.

See `e50-fetch-limit-prop` for an example.

#### `e50-fetch-limit-prop="string"`

**Requires `e50-fetch`, `e50-fetch-limit`**. Similar to `e50-data-prop`, represents an object property of the fetched data that should represent the total size of the data set.

##### Example:

**/endpoint** responds like so:

```json
{
  "success": true,
  "messages": [],
  "data": {
    "total": 50,
    "list": [
      { "name": "Sharon" },
      { "name": "Theresa" },
      { "name": "Carol" },
      { "name": "Carmen" },
      { "name": "Trisha" }
    ]
  }
}
```

The table is set up like:

```html
<table e50-table
       e50-data-prop="list"
       e50-fetch="/endpoint"
       e50-fetch-params="{ orderBy: sort }"
       e50-sort="{{ sort }}"
       e50-fetch-limit="5"
       e50-fetch-limit-prop="total">
```

In this situation, the data will only be fetched once if `data.total` <= 5. In that case, if the value of `$scope.sort` changes, it will simply adjust the sorting on the client-side. If `data.total` > 5, then the table will fetch as normal if `$scope.sort` changes.

#### `e50-loading` `e50-loading="string"`

**Requires `e50-fetch`**. If provided, will $emit and/or $broadcast an event when a fetch is in progress. If `string = 'broadcast'`, it will only $broadcast. If `string = 'emit'`, it will only $emit.

The events emitted are the equivalent of
```javascript
$scope.$emit('loading-show', 'e50-table-loading');
$scope.$emit('loading-hide', 'e50-table-loading');
```

#### `e50-infinite-loading` `e50-infinite-loading="string"`

**Requires `e50-fetch`, `e50-infinite-scroll`**. If provided, will $emit and/or $broadcast an event when an infinite-scroll fetch is in progress. If `string = 'broadcast'`, it will only $broadcast. If `string = 'emit'`, it will only $emit.

The events emitted are the equivalent of
```javascript
$scope.$emit('loading-show', 'e50-table-infinite-loading');
$scope.$emit('loading-hide', 'e50-table-infinite-loading');
```

#### `e50-if-data` `e50-data='false'`

Can be placed on *any* HTML element within the directive. If provided, the element will be hidden if the data set is empty. If `false` is provided, then the element will be *shown* only when the data set is empty.

#### `e50-if-no-data="string"`

**Requires `e50-if-data`**. Placed on same element as `e50-if-data`. If provided, a message `string` with CSS class `'e50-no-data'` will replace the element when the data set is empty.

#### `e50-if-loading-data` `e50-if-loading-data="string"`

**Requires `e50-if-data`**. Placed on same element as `e50-if-data`. Similar to `e50-if-no-data`, if provided, a message with CSS class `'e50-no-data'` will replace the element when the data set is loading for the first time. If a value is provided, the message will be `string`; otherwise, it will be `'Loading data'`.

#### `e50-views="string"`

If provided, any table HTML element with `e50-view` will only be visible if `string` equals the value of that view's `e50-view` attribute.

This is useful for toggling between different markup for displaying the same data set (e.g. a table view vs. a list view).

#### `e50-view="string"`

**Requires `e50-views`**. Placed on *any* HTML element within the directive. If provided, the element will only be visible if the table's `e50-views` attribute has the value `string`.

This is useful for toggling between different markup for displaying the same data set (e.g. a table view vs. a list view).

#### `e50-hover` `e50-hover="string"`

Placed on *any* HTML element within the directive. If provided, hovering over the element will toggle the `string` CSS class (`'hover'` if not specified).

#### `e50-no-prop`

Placed on *any* HTML element within the directive. If provided, clicking on the element will not propagate a click event up the inheritance tree.

This is useful if you have a click event on an entire table row, but want to have additional distinct links within a cell in that row.

### Scope variables

The Elite50 Table directive creates a child scope with a few distinct scope variables that may be accessed programmatically.

#### `e50GetData()`

A function that returns the entire data set currently displayed in the table.

#### `e50SetData(data)`

A function that replaces the table's data set with `data`.

#### `e50DeleteRow(row)`

A function that filters out a particular row from the data set in a way that persists across fetches. Currently, this requires that the row data object has an `id` property.

This is useful if you want to have a delete link on your row, or use it as a callback after making a delete AJAX request.

##### Example 1:

```html
<tr e50-table-row>
  <td>{{ t.name }}</td>
  <td><a ng-click="e50DeleteRow(t)">Delete</a></td>
</tr>
```

##### Example 2:

```javascript
$scope.deleteRow = function(row, callback) {
  $http.delete(row.id).success(function() {
    callback(row);
  }
};
```

```html
<tr e50-table-row>
  <td>{{ t.name }}</td>
  <td><a ng-click="deleteRow(t, e50DeleteRow)">Delete</a></td>
</tr>
```

## License
[GNU General Public License v3](http://www.gnu.org/copyleft/gpl.html)

