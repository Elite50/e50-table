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
      <th>Left</th>
      <th>Right</th>
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

| Left | Right  |
| ---- | ---- |
| A  | B  |
| C  | D  |

## Full Documentation

### Attributes

The Elite50 Table supports many different HTML attributes, allowing for a large degree of customization and functionality. With the exception of `e50-table` and `e50-table-row`, all attributes are optional. The full list of possible attributes follows:

#### `e50-table` `e50-table="string"`

**Required**. Demarcates the directive and establishes a child scope. Unless otherwise stated, all Elite50 Table attributes must be placed on the same HTML element as this one. If a value is provided, it will seek only `e50-table-row` elements with the same value (allowing for nesting of multiple tables).

#### `e50-table-row` `e50-table-row="string"`

**Required**. Placed on a *different* HTML element than `e50-table`. This element will be repeated for each value in the data set, creating multiple child scopes. Works like [ngRepeat](https://docs.angularjs.org/api/ng/directive/ngRepeat). If a value is provided, it will be sought only by `e50-table` elements with the same value (allowing for nesting of multiple tables).

#### `e50-table-row-end`

Placed on a sibling element following the `e50-table-row` element. If provided, all elements starting with `e50-table-row` and ending with this element will be repeated for each row of the table. Works like `ng-repeat-start`/`ng-repeat-end`.

#### `e50-data="expr:array|object"`

If provided, passes in an Angular expression returning the data with which to populate the table. Each value in the array becomes a separate scope variable `t` for an individual `e50-table-row`.

This creates a two-way binding between the table data and the parent scope variable passed in. The value is expected to be an array unless `e50-data-prop` is set. The row value `t` can can be given a different alias using `e50-data-key`.

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

#### `e50-fetch="string"`

If provided, the table will make an AJAX request to the specified url `string` and use the response to populate the table. It expects the response as a JSON object with a `data` property, which it will use to fill the table.

The `string` can be parameterized using `:param` syntax, as in [ngResource](https://docs.angularjs.org/api/ngResource). These paremeters will be populated by the `e50-fetch-params` attribute.

If `e50-data` is set, the result of the fetch will replace the parent scope variable defined by the `e50-data` attribute.

By default, the directive will make a `GET` request with no parameters. This, and other behaviors, can be modified with other attributes.

See `e50-fetch-params` for examples.

#### `e50-fetch-method="string"`

**Requires `e50-fetch`**. **Default: 'GET'**. Specifies the type of HTTP request to make when fetching table data.

#### `e50-fetch-params="expr:object"`

**Requires `e50-fetch`**. If provided, defines additional parameters to be sent in the fetch HTTP request.

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

#### `e50-fetch-body="expr:object"`

**Requires `e50-fetch`**. Similarly to `e50-fetch-params`, this object is sent as the body of the HTTP request (if the `e50-fetch-method` supports request bodies). Like for `e50-fetch-params`, a new request will be made every time this object is changed (unless `e50-fetch-once` or `e50-fetch-limit` is set).

#### `e50-if-success="expr:function"`

**Requires `e50-fetch`**. If provided, the table will call `function` in the event of a successful AJAX request (passing the response body as an argument).

#### `e50-if-error="expr:function"`

**Requires `e50-fetch`**. If provided, the table will call `function` in the event of an AJAX error (passing the response body as an argument).

#### `e50-fetch-once`

**Requires `e50-fetch`**. If provided, the table will only make a single initial AJAX fetch request, and will *not* update if `e50-fetch-params` or `e50-fetch-body` changes.

#### `e50-poll` `e50-poll="integer"`

**Requires `e50-fetch`**. If provided, the table will make a fetch request every
`1000ms` (or `integer` milliseconds if a value is provided), and update the table if the response is successful and the data has changed.

#### `e50-infinite-scroll` `e50-infinite-scroll="expr:function(callback)"`

**Requires `e50-fetch` OR a value OR both**.

##### If a value is provided:

When the table is fully scrolled to the bottom, `function` will be called, passing in a single `callback` argument. `function` will not be called again until `callback` is called, which resets the infinite scroll listener.

##### If `e50-fetch` is set:

When the table is fully scrolled to the bottom it will automatically fetch more results. This requires special `offset` and `limit` keys (or as otherwise defined by `e50-offset-key` or `e50-limit-key`) to be included in either the `e50-fetch-params` or `e50-fetch-body`. The fetch endpoint should account for these parameters (fetching `limit` results starting at `offset`, similar to SQL `select` syntax).

When scrolled to the bottom, the `offset` will be incremented by `limit` and the table will fetch, appending the new results to the end of the list. If `e50-poll` is enabled, the `limit` instead will be incremented, increasing the size of the data set fetched on each poll.

If any of the other `e50-fetch-params` or `e50-fetch-body` values change, the `offset` and `limit` will reset to their initial values, and the table will update as expected.

#### `e50-offset-key="string"`

**Requires `e50-infinite-scroll`**. **Default: 'offset'**. Specifies a different name for the infinite-scrolling offset parameter included in either `e50-fetch-params` or `e50-fetch-body`.

#### `e50-limit-key="string"`

**Requires `e50-infinite-scroll`**. **Default: 'limit'**. Specifies a different name for the infinite-scrolling limit parameter included in either `e50-fetch-params` or `e50-fetch-body`.

#### `e50-filter="expr:function"`

If provided, the table will be filtered according to parent scope function provided. The function takes in a single row's data as a parameter, and must return `true` if it should be included, or `false` otherwise.

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

#### `e50-deduplicate` `e50-deduplicate="expr:function"`

If set, the table will filter out duplicate rows. If no expression is provided, the table will check for duplicates using `angular.equals()`. If a function expression is provided, the function will be called with two rows as parameters, and should return `true` if the rows are duplicates, and `false` otherwise.

##### Example:

```javascript
$scope.isDuplicate = function(a, b) {
   return a.id === b.id;
};
$scope.data = [
  { id: 1, name: 'Will' },
  { id: 2, name: 'John' },
  { id: 1, name: 'William' }
];
```

```html
<table e50-table e50-data="data" e50-deduplicate="isDuplicate">
  <thead>
    <tr>
      <th>Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{ t.name }}</td>
    </tr>
  </tbody>
</table>
```

##### Result:

|Name|
|----|
|Will|
|John|

#### `e50-limit-to="expr:integer"`

If provided, the table will be only display the first `integer` rows of the dataset.

#### `e50-sort="expr:string"`

If provided, will order the table data according to the evaluated `string`. Uses the same format as an Angular string [orderBy](https://docs.angularjs.org/api/ng/filter/orderBy) expression.

#### `e50-sort-reverse="expr:boolean"`

**Requires `e50-sort`**. If provided, will reverse the table sort order if its value evaluates to `true`.

#### `e50-sort-lock="expr:boolean"`

**Requires `e50-sort`**. If provided, will 'lock' the table rows in place when its value evaluates to `true`, ignoring changes to `e50-sort` and `e50-sort-reverse`. If its value becomes `false`, sorting will immediately update.

#### `e50-fetch-limit="integer"`

**Requires `e50-fetch`, `e50-fetch-limit-prop`**. If provided, the table will act as though `e50-fetch-once` is set if a fetched property (see `e50-fetch-limit-prop`) is less than or equal to `integer`.

This feature is useful if you have data sets of varying sizes, and you want to forego server-side sorting if the total size of the data set is less than a particular limit.

See `e50-fetch-limit-prop` for an example.

#### `e50-fetch-limit-unless="expr:array"`

**Requires `e50-fetch`, `e50-fetch-limit`, `e50-fetch-params`/`e50-fetch-body`**. If included, you can pass in an array of parameters (properties of either `e50-fetch-params` or `e50-fetch-body`) that will ignore `e50-fetch-limit`. In this situation, the table will always fetch from the server if any of the specified parameters have changed, regardless of the number of records in the table.

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
       e50-fetch-params="{ resource: type, orderBy: sort }"
       e50-sort="{{ sort }}"
       e50-fetch-limit="5"
       e50-fetch-limit-prop="total"
       e50-fetch-limit-unless="['resource']">
```

In this situation, the data will only be fetched once if `data.total` <= 5. In that case, if the value of `$scope.sort` changes, it will simply adjust the sorting on the client-side. If `data.total` > 5, then the table will fetch as normal if `$scope.sort` changes. However, because `e50-limit-unless` is set, the table will always re-fetch from the server if `$scope.type` changes.

#### `e50-loading` `e50-loading="string"`

**Requires `e50-fetch`**. If provided, will $emit and/or $broadcast an event when a fetch is in progress. If its value is `'broadcast'`, it will only $broadcast. If its value is `'emit'`, it will only $emit.

The event emitted is the equivalent of
```javascript
$scope.$emit('loading', fetchPromise, 'e50-table-loading', true);
```
where `fetchPromise` is a Promise that will be resolved when the fetch completes.

#### `e50-infinite-loading` `e50-infinite-loading="string"`

**Requires `e50-fetch`, `e50-infinite-scroll`**. If provided, will $emit and/or $broadcast an event when an infinite-scroll fetch is in progress. If its value is `'broadcast'`, it will only $broadcast. If its value is `'emit'`, it will only $emit.

The event emitted is the equivalent of
```javascript
$scope.$emit('loading', fetchPromise, 'e50-table-infinite-loading', true);
```
where `fetchPromise` is a Promise that will be resolved when the fetch completes.

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

#### `e50-hover-if="expr:boolean"`

**Requires `e50-hover`**. Placed on the same element as `e50-hover`. If provided, the hover effect is only enabled when its value evaluates to `true`.

#### `e50-no-prop`

Placed on *any* HTML element within the directive. If provided, clicking on the element will not propagate a click event up the DOM.

This is useful if you have a click event on an entire table row, but want to have additional distinct links within a cell in that row.

#### `e50-drag`

**Requires `e50-drag-handle`**. Placed on the same element as `e50-table-row`. If provided, the table rows can be reordered by dragging. While a row is being dragged, it gains the CSS class `'e50-dragging'` (and optionally the value of `e50-drag-class`) and a hovering overlay appears with CSS class `'e50-drag-overlay'` (and optionally the value of `e50-drag-overlay-class`).

Note that dragging the rows will have no effect if `e50-sort` is applied to the table.

#### `e50-drag-handle` `e50-drag-handle="expr:boolean"`

**Requires `e50-drag`**. Placed on the same element as `e50-drag` or *any* child element. This attribute specifies the UI element that initializes the drag. When a user clicks and drags the element, row reordering begins. If a value is provided, the drag controls will only be active when the value evaluates to `true`.

#### `e50-drag-class="string"`

**Requires `e50-drag`**. Placed on the same element as `e50-drag`. If provided, the row being dragged gains the css class `string`.

#### `e50-drag-overlay-class="string"`

**Requires `e50-drag`**. Placed on the same element as `e50-drag`. If provided, the hovering drag overlay gains the css class `string`.

#### `e50-drag-x`

**Requires `e50-drag`**. Placed on the same element as `e50-drag`. If provided, drag motion is restricted to the x axis.

#### `e50-drag-y`

**Requires `e50-drag`**. Placed on the same element as `e50-drag`. If provided, drag motion is restricted to the y axis.

#### `e50-drag-gravity` `e50-drag-gravity="integer"`

**Requires `e50-drag-x` *or* `e50-drag-y`**. **Default: 0**. Placed on the same element as `e50-drag`. If provided, adds a 'gravity' visual effect to the drag axis restrictions, allowing a small margin of movement in the restricted directions. If a value is included, the row may be dragged `integer` pixels freely before the gravity takes effect.

### Scope variables

The Elite50 Table directive creates a child scope with a few distinct scope variables that may be accessed programmatically.

#### `e50GetData()`

A function that returns the entire data set currently displayed in the table.

#### `e50SetData(data)`

A function that replaces the table's data set with `data`.

#### `e50DeleteRow(row)`

A function that filters out a particular row from the data set in a way that persists across fetches. This requires that the row data object has an `id` property.

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
  });
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

